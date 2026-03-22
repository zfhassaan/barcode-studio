import { ref, watch, onMounted, nextTick, computed } from 'vue'
import JsBarcode from 'jsbarcode'
import QRCode from 'qrcode'
import JSZip from 'jszip'
import {
  STORAGE,
  SIZE_PRESETS,
  BARCODE_W,
  BARCODE_H,
  isValidDownloadKind,
  isValidFormat,
  formatLabel,
  sanitizeFilename,
} from '../constants.js'

export function useBarcodeGenerator() {
  const text = ref('')
  const format = ref('')
  const downloadKind = ref('png')
  const qrEcLevel = ref('M')
  const qrMargin = ref(2)
  const qrDark = ref('#111827')
  const qrLight = ref('#ffffff')
  const linearMargin = ref(10)
  const sizePreset = ref('medium')
  const theme = ref('system')
  const recent = ref([])
  const batchText = ref('')
  const copyStatus = ref('')
  const error = ref('')
  const canvasRef = ref(null)

  const presetPx = computed(() => {
    const p = SIZE_PRESETS.find((s) => s.value === sizePreset.value)
    return p ? p.px : 256
  })

  let debounceTimer = null

  function debounceRender() {
    window.clearTimeout(debounceTimer)
    debounceTimer = window.setTimeout(() => {
      render().catch(() => {})
    }, 120)
  }

  async function renderBarcodeToCanvasWith(canvas, value, fmt, qrPx) {
    const v = String(value || '').trim()
    if (!fmt || !v) throw new Error('Missing input')
    if (fmt === 'qrcode') {
      canvas.width = qrPx
      canvas.height = qrPx
      await QRCode.toCanvas(canvas, v, {
        width: qrPx,
        margin: qrMargin.value,
        color: { dark: qrDark.value, light: qrLight.value },
        errorCorrectionLevel: qrEcLevel.value,
      })
    } else {
      JsBarcode(canvas, v, {
        format: fmt,
        width: 2,
        height: 80,
        displayValue: true,
        fontSize: 13,
        margin: linearMargin.value,
        background: '#ffffff',
        lineColor: '#111827',
      })
    }
  }

  async function buildSvgMarkup(value, fmt) {
    const v = String(value || '').trim()
    const px = presetPx.value
    if (fmt === 'qrcode') {
      return await QRCode.toString(v, {
        width: px,
        margin: qrMargin.value,
        color: { dark: qrDark.value, light: qrLight.value },
        errorCorrectionLevel: qrEcLevel.value,
      })
    }
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    JsBarcode(svg, v, {
      xmlDocument: document,
      format: fmt,
      width: 2,
      height: 80,
      displayValue: true,
      fontSize: 13,
      margin: linearMargin.value,
      background: '#ffffff',
      lineColor: '#111827',
    })
    return new XMLSerializer().serializeToString(svg)
  }

  async function render() {
    await nextTick()
    const canvas = canvasRef.value
    if (!canvas) return

    const value = text.value.trim()
    error.value = ''

    const ctx = canvas.getContext('2d')
    const isQr = format.value === 'qrcode'
    const px = presetPx.value

    if (!format.value) {
      canvas.width = BARCODE_W
      canvas.height = BARCODE_H
      ctx.fillStyle = '#f3f4f6'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#6b7280'
      ctx.font = '14px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Select a barcode format below', canvas.width / 2, canvas.height / 2 - 8)
      ctx.fillStyle = '#9ca3af'
      ctx.font = '12px system-ui, sans-serif'
      ctx.fillText('(required)', canvas.width / 2, canvas.height / 2 + 14)
      return
    }

    if (!value) {
      if (isQr) {
        canvas.width = px
        canvas.height = px
      } else {
        canvas.width = BARCODE_W
        canvas.height = BARCODE_H
      }
      ctx.fillStyle = '#f3f4f6'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#9ca3af'
      ctx.font = '14px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Enter content to generate', canvas.width / 2, canvas.height / 2)
      return
    }

    try {
      await renderBarcodeToCanvasWith(canvas, value, format.value, px)
    } catch (e) {
      error.value = e?.message || String(e)
      if (isQr) {
        canvas.width = px
        canvas.height = px
      } else {
        canvas.width = BARCODE_W
        canvas.height = BARCODE_H
      }
      ctx.fillStyle = '#f3f4f6'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#9ca3af'
      ctx.font = '13px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Fix input or try another format', canvas.width / 2, canvas.height / 2)
    }
  }

  async function persist() {
    await chrome.storage.local.set({
      [STORAGE.text]: text.value,
      [STORAGE.format]: format.value,
      [STORAGE.downloadKind]: downloadKind.value,
      [STORAGE.qrEc]: qrEcLevel.value,
      [STORAGE.qrMargin]: qrMargin.value,
      [STORAGE.qrDark]: qrDark.value,
      [STORAGE.qrLight]: qrLight.value,
      [STORAGE.linearMargin]: linearMargin.value,
      [STORAGE.sizePreset]: sizePreset.value,
      [STORAGE.theme]: theme.value,
      [STORAGE.recent]: recent.value,
      [STORAGE.batch]: batchText.value,
    })
  }

  const canDownload = () => !!format.value && !!text.value.trim() && !error.value

  const batchLines = computed(() =>
    batchText.value.split(/\r?\n/).map((l) => l.trim()).filter(Boolean),
  )

  function canBatchZipFn() {
    return !!format.value && batchLines.value.length > 0
  }

  function triggerDownload(href, filename) {
    const a = document.createElement('a')
    a.href = href
    a.download = filename
    a.click()
  }

  function triggerBlobDownload(blob, filename) {
    const url = URL.createObjectURL(blob)
    triggerDownload(url, filename)
    URL.revokeObjectURL(url)
  }

  function rasterDataUrlFromCanvas(canvas, kind) {
    if (kind === 'png') return canvas.toDataURL('image/png')

    const w = canvas.width
    const h = canvas.height
    const tmp = document.createElement('canvas')
    tmp.width = w
    tmp.height = h
    const tctx = tmp.getContext('2d')
    tctx.fillStyle = '#ffffff'
    tctx.fillRect(0, 0, w, h)
    tctx.drawImage(canvas, 0, 0)

    if (kind === 'jpeg') return tmp.toDataURL('image/jpeg', 0.92)
    if (kind === 'webp') {
      const u = tmp.toDataURL('image/webp', 0.92)
      if (u.indexOf('image/webp') === -1) return tmp.toDataURL('image/png')
      return u
    }
    return canvas.toDataURL('image/png')
  }

  function extForRasterDataUrl(dataUrl, preferredExt) {
    if (preferredExt === 'webp' && dataUrl.indexOf('image/webp') === -1) return 'png'
    return preferredExt
  }

  function addToRecent() {
    const t = text.value.trim()
    if (!t) return
    recent.value = [t, ...recent.value.filter((x) => x !== t)].slice(0, 10)
    persist().catch(() => {})
  }

  async function downloadFile() {
    if (!canDownload()) return
    const value = text.value.trim()
    const kind = downloadKind.value
    const slug = formatLabel(format.value).replace(/\s+/g, '-')
    const safe = sanitizeFilename(value)

    if (kind === 'svg') {
      try {
        const svgMarkup = await buildSvgMarkup(value, format.value)
        const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' })
        triggerBlobDownload(blob, `${slug}-${safe}.svg`)
        addToRecent()
      } catch (e) {
        error.value = e?.message || String(e)
      }
      return
    }

    const canvas = canvasRef.value
    if (!canvas) return
    const dataUrl = rasterDataUrlFromCanvas(canvas, kind)
    const ext = extForRasterDataUrl(dataUrl, kind)
    triggerDownload(dataUrl, `${slug}-${safe}.${ext}`)
    addToRecent()
  }

  async function copyOutput() {
    if (!canDownload()) return
    copyStatus.value = ''
    try {
      if (downloadKind.value === 'svg') {
        const svg = await buildSvgMarkup(text.value.trim(), format.value)
        await navigator.clipboard.writeText(svg)
        copyStatus.value = 'SVG copied'
      } else {
        const c = canvasRef.value
        const blob = await new Promise((resolve, reject) => {
          c.toBlob((b) => (b ? resolve(b) : reject(new Error('No image'))), 'image/png')
        })
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        copyStatus.value = 'PNG copied'
      }
      addToRecent()
    } catch {
      copyStatus.value = 'Copy failed'
    }
    window.setTimeout(() => {
      copyStatus.value = ''
    }, 2200)
  }

  async function downloadBatchZip() {
    if (!canBatchZipFn()) return
    const lines = batchLines.value
    const fmt = format.value
    const kind = downloadKind.value
    const px = presetPx.value
    const zip = new JSZip()
    const canvas = document.createElement('canvas')
    let added = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const base = `${String(i + 1).padStart(3, '0')}-${sanitizeFilename(line)}`
      try {
        if (kind === 'svg') {
          const svg = await buildSvgMarkup(line, fmt)
          zip.file(`${base}.svg`, svg)
          added += 1
        } else {
          await renderBarcodeToCanvasWith(canvas, line, fmt, px)
          const dataUrl = rasterDataUrlFromCanvas(canvas, kind)
          const ext = extForRasterDataUrl(dataUrl, kind)
          const b64 = dataUrl.split(',')[1]
          if (b64) {
            zip.file(`${base}.${ext}`, b64, { base64: true })
            added += 1
          }
        }
      } catch {
        // skip invalid line
      }
    }

    if (!added) {
      copyStatus.value = 'No valid lines in batch'
      window.setTimeout(() => {
        copyStatus.value = ''
      }, 2500)
      return
    }

    const blob = await zip.generateAsync({ type: 'blob' })
    const slug = formatLabel(fmt).replace(/\s+/g, '-')
    triggerBlobDownload(blob, `${slug}-batch.zip`)
  }

  function pickRecent(entry) {
    text.value = entry
  }

  function clearRecent() {
    recent.value = []
    persist().catch(() => {})
  }

  function onCsvImport(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      batchText.value = String(reader.result || '')
      persist().catch(() => {})
    }
    reader.readAsText(file)
  }

  watch(
    [
      text,
      format,
      downloadKind,
      qrEcLevel,
      qrMargin,
      qrDark,
      qrLight,
      linearMargin,
      sizePreset,
      theme,
      batchText,
    ],
    () => {
      debounceRender()
      persist().catch(() => {})
    },
  )

  onMounted(async () => {
    const stored = await chrome.storage.local.get({
      [STORAGE.text]: '',
      [STORAGE.format]: '',
      [STORAGE.downloadKind]: 'png',
      [STORAGE.qrEc]: 'M',
      [STORAGE.qrMargin]: 2,
      [STORAGE.qrDark]: '#111827',
      [STORAGE.qrLight]: '#ffffff',
      [STORAGE.linearMargin]: 10,
      [STORAGE.sizePreset]: 'medium',
      [STORAGE.theme]: 'system',
      [STORAGE.recent]: [],
      [STORAGE.batch]: '',
    })

    const pre = await chrome.storage.local.get('contextPrefillText')
    if (typeof pre.contextPrefillText === 'string' && pre.contextPrefillText) {
      text.value = pre.contextPrefillText
      await chrome.storage.local.remove('contextPrefillText')
    } else {
      text.value = typeof stored[STORAGE.text] === 'string' ? stored[STORAGE.text] : ''
    }

    const f = stored[STORAGE.format]
    format.value = isValidFormat(f) ? f : ''
    const dk = stored[STORAGE.downloadKind]
    downloadKind.value = isValidDownloadKind(dk) ? dk : 'png'
    qrEcLevel.value = ['L', 'M', 'Q', 'H'].includes(stored[STORAGE.qrEc]) ? stored[STORAGE.qrEc] : 'M'
    qrMargin.value = Math.min(4, Math.max(1, Number(stored[STORAGE.qrMargin]) || 2))
    qrDark.value = typeof stored[STORAGE.qrDark] === 'string' ? stored[STORAGE.qrDark] : '#111827'
    qrLight.value = typeof stored[STORAGE.qrLight] === 'string' ? stored[STORAGE.qrLight] : '#ffffff'
    linearMargin.value = Math.min(24, Math.max(4, Number(stored[STORAGE.linearMargin]) || 10))
    sizePreset.value = SIZE_PRESETS.some((s) => s.value === stored[STORAGE.sizePreset])
      ? stored[STORAGE.sizePreset]
      : 'medium'
    theme.value = ['system', 'light', 'dark'].includes(stored[STORAGE.theme])
      ? stored[STORAGE.theme]
      : 'system'
    recent.value = Array.isArray(stored[STORAGE.recent]) ? stored[STORAGE.recent].slice(0, 10) : []
    batchText.value = typeof stored[STORAGE.batch] === 'string' ? stored[STORAGE.batch] : ''

    await render()
  })

  return {
    text,
    format,
    downloadKind,
    qrEcLevel,
    qrMargin,
    qrDark,
    qrLight,
    linearMargin,
    sizePreset,
    theme,
    recent,
    batchText,
    copyStatus,
    error,
    canvasRef,
    presetPx,
    canDownload,
    batchLines,
    canBatchZipFn,
    downloadFile,
    copyOutput,
    downloadBatchZip,
    pickRecent,
    clearRecent,
    onCsvImport,
  }
}
