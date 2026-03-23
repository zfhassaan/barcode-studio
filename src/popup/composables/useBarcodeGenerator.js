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

function escapeWifiValue(s) {
  return String(s ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/"/g, '\\"')
}

export function useBarcodeGenerator() {
  const text = ref('')
  const format = ref('')
  const downloadKind = ref('png')
  const qrEcLevel = ref('M')
  const qrMargin = ref(2)
  const qrDark = ref('#111827')
  const qrLight = ref('#ffffff')
  const linearMargin = ref(10)
  const linearShowText = ref(true)
  const sizePreset = ref('medium')
  const theme = ref('system')
  const recent = ref([])
  const batchText = ref('')
  const copyStatus = ref('')
  const error = ref('')
  const canvasRef = ref(null)

  const payloadMode = ref('plain')
  const wifiSsid = ref('')
  const wifiPassword = ref('')
  const wifiSecurity = ref('WPA')
  const wifiHidden = ref(false)

  const filenamePattern = ref('default')

  const presetPx = computed(() => {
    const p = SIZE_PRESETS.find((s) => s.value === sizePreset.value)
    return p ? p.px : 256
  })

  const showQrMarginWarn = computed(
    () => format.value === 'qrcode' && qrMargin.value <= 1,
  )
  const showLinearMarginWarn = computed(
    () => !!format.value && format.value !== 'qrcode' && linearMargin.value < 6,
  )
  const formatValidation = computed(() =>
    validatePayloadForFormat(format.value, text.value.trim()),
  )

  let debounceTimer = null

  function debounceRender() {
    window.clearTimeout(debounceTimer)
    debounceTimer = window.setTimeout(() => {
      render().catch(() => {})
    }, 120)
  }

  function buildWifiPayload() {
    const T = wifiSecurity.value === 'nopass' ? 'nopass' : wifiSecurity.value
    const S = escapeWifiValue(wifiSsid.value)
    const P = wifiSecurity.value === 'nopass' ? '' : escapeWifiValue(wifiPassword.value)
    const H = wifiHidden.value ? 'true' : 'false'
    return `WIFI:T:${T};S:${S};P:${P};H:${H};;`
  }

  function buildDownloadBasename(slug, safe, ext) {
    const p = filenamePattern.value
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const dateStr = `${y}${m}${day}`
    if (p === 'dated') return `${slug}-${dateStr}-${safe}.${ext}`
    if (p === 'minimal') return `${safe}.${ext}`
    return `${slug}-${safe}.${ext}`
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
        displayValue: linearShowText.value,
        fontSize: linearShowText.value ? 13 : 0,
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
      displayValue: linearShowText.value,
      fontSize: linearShowText.value ? 13 : 0,
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
      [STORAGE.linearShowText]: linearShowText.value,
      [STORAGE.sizePreset]: sizePreset.value,
      [STORAGE.theme]: theme.value,
      [STORAGE.recent]: recent.value,
      [STORAGE.batch]: batchText.value,
      [STORAGE.payloadMode]: payloadMode.value,
      [STORAGE.wifiSsid]: wifiSsid.value,
      [STORAGE.wifiPassword]: wifiPassword.value,
      [STORAGE.wifiSecurity]: wifiSecurity.value,
      [STORAGE.wifiHidden]: wifiHidden.value,
      [STORAGE.filenamePattern]: filenamePattern.value,
    })
  }

  function validatePayloadForFormat(fmt, value) {
    const v = String(value || '').trim()
    if (!fmt) return { ok: false, text: 'Choose a symbology to start.' }
    if (!v) return { ok: false, text: 'Enter content to generate a preview.' }

    if (fmt === 'qrcode') return { ok: true, text: 'Valid QR payload.' }
    if (fmt === 'CODE128') {
      const ok = /^[\x20-\x7E]+$/.test(v)
      return { ok, text: ok ? 'Valid CODE128 payload.' : 'Use printable ASCII characters only.' }
    }
    if (fmt === 'CODE39') {
      const ok = /^[0-9A-Z\-\. $\/+%]+$/.test(v)
      return { ok, text: ok ? 'Valid CODE39 payload.' : 'Use A-Z, 0-9, space, and - . $ / + % only.' }
    }
    if (fmt === 'EAN13') {
      const ok = /^\d{12,13}$/.test(v)
      return { ok, text: ok ? 'Valid EAN-13 payload.' : 'EAN-13 requires 12 or 13 digits.' }
    }
    if (fmt === 'EAN8') {
      const ok = /^\d{7,8}$/.test(v)
      return { ok, text: ok ? 'Valid EAN-8 payload.' : 'EAN-8 requires 7 or 8 digits.' }
    }
    if (fmt === 'UPC') {
      const ok = /^\d{11,12}$/.test(v)
      return { ok, text: ok ? 'Valid UPC-A payload.' : 'UPC-A requires 11 or 12 digits.' }
    }
    if (fmt === 'ITF') {
      const ok = /^\d+$/.test(v) && v.length % 2 === 0
      return { ok, text: ok ? 'Valid ITF payload.' : 'ITF requires an even number of digits.' }
    }
    if (fmt === 'codabar') {
      const ok = /^[ABCD][0-9\-\$:\/\.\+]+[ABCD]$/.test(v)
      return { ok, text: ok ? 'Valid Codabar payload.' : 'Codabar should start/end with A-D (for example A123B).' }
    }
    return { ok: true, text: 'Payload ready.' }
  }

  const canDownload = () => formatValidation.value.ok && !error.value

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
        triggerBlobDownload(blob, buildDownloadBasename(slug, safe, 'svg'))
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
    triggerDownload(dataUrl, buildDownloadBasename(slug, safe, ext))
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

  async function copyDataUrl() {
    if (!canDownload()) return
    copyStatus.value = ''
    try {
      const value = text.value.trim()
      const kind = downloadKind.value
      if (kind === 'svg') {
        const svg = await buildSvgMarkup(value, format.value)
        const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
        await navigator.clipboard.writeText(dataUrl)
      } else {
        const canvas = canvasRef.value
        if (!canvas) return
        const dataUrl = rasterDataUrlFromCanvas(canvas, kind)
        await navigator.clipboard.writeText(dataUrl)
      }
      copyStatus.value = 'Data URL copied'
      addToRecent()
    } catch {
      copyStatus.value = 'Copy failed'
    }
    window.setTimeout(() => {
      copyStatus.value = ''
    }, 2200)
  }

  async function fillCurrentTabUrl() {
    copyStatus.value = ''
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      const u = tab?.url
      if (!u || !/^https?:\/\//i.test(u)) {
        copyStatus.value = 'No http(s) page on this tab'
        window.setTimeout(() => {
          copyStatus.value = ''
        }, 2200)
        return
      }
      payloadMode.value = 'plain'
      text.value = u
    } catch {
      copyStatus.value = 'Could not read tab URL'
      window.setTimeout(() => {
        copyStatus.value = ''
      }, 2200)
    }
  }

  function resetFields() {
    text.value = ''
    batchText.value = ''
    payloadMode.value = 'plain'
    wifiSsid.value = ''
    wifiPassword.value = ''
    wifiSecurity.value = 'WPA'
    wifiHidden.value = false
    persist().catch(() => {})
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
    if (String(entry).startsWith('WIFI:')) {
      payloadMode.value = 'wifi'
    } else {
      payloadMode.value = 'plain'
    }
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
    [wifiSsid, wifiPassword, wifiSecurity, wifiHidden, payloadMode, format],
    () => {
      if (format.value !== 'qrcode' || payloadMode.value !== 'wifi') return
      const next = buildWifiPayload()
      if (text.value !== next) text.value = next
    },
  )

  watch(format, (f) => {
    if (f !== 'qrcode' && payloadMode.value === 'wifi') payloadMode.value = 'plain'
  })

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
      linearShowText,
      sizePreset,
      theme,
      batchText,
      payloadMode,
      filenamePattern,
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
      [STORAGE.linearShowText]: true,
      [STORAGE.sizePreset]: 'medium',
      [STORAGE.theme]: 'system',
      [STORAGE.recent]: [],
      [STORAGE.batch]: '',
      [STORAGE.payloadMode]: 'plain',
      [STORAGE.wifiSsid]: '',
      [STORAGE.wifiPassword]: '',
      [STORAGE.wifiSecurity]: 'WPA',
      [STORAGE.wifiHidden]: false,
      [STORAGE.filenamePattern]: 'default',
    })

    const pre = await chrome.storage.local.get('contextPrefillText')
    if (typeof pre.contextPrefillText === 'string' && pre.contextPrefillText) {
      text.value = pre.contextPrefillText
      payloadMode.value = 'plain'
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
    linearShowText.value = stored[STORAGE.linearShowText] !== false
    sizePreset.value = SIZE_PRESETS.some((s) => s.value === stored[STORAGE.sizePreset])
      ? stored[STORAGE.sizePreset]
      : 'medium'
    theme.value = ['system', 'light', 'dark'].includes(stored[STORAGE.theme])
      ? stored[STORAGE.theme]
      : 'system'
    recent.value = Array.isArray(stored[STORAGE.recent]) ? stored[STORAGE.recent].slice(0, 10) : []
    batchText.value = typeof stored[STORAGE.batch] === 'string' ? stored[STORAGE.batch] : ''

    payloadMode.value = stored[STORAGE.payloadMode] === 'wifi' ? 'wifi' : 'plain'
    wifiSsid.value = typeof stored[STORAGE.wifiSsid] === 'string' ? stored[STORAGE.wifiSsid] : ''
    wifiPassword.value = typeof stored[STORAGE.wifiPassword] === 'string' ? stored[STORAGE.wifiPassword] : ''
    wifiSecurity.value = ['WPA', 'WEP', 'nopass'].includes(stored[STORAGE.wifiSecurity])
      ? stored[STORAGE.wifiSecurity]
      : 'WPA'
    wifiHidden.value = !!stored[STORAGE.wifiHidden]
    filenamePattern.value = ['default', 'dated', 'minimal'].includes(stored[STORAGE.filenamePattern])
      ? stored[STORAGE.filenamePattern]
      : 'default'

    if (format.value === 'qrcode' && payloadMode.value === 'wifi') {
      text.value = buildWifiPayload()
    }

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
    linearShowText,
    sizePreset,
    theme,
    recent,
    batchText,
    copyStatus,
    error,
    canvasRef,
    presetPx,
    payloadMode,
    wifiSsid,
    wifiPassword,
    wifiSecurity,
    wifiHidden,
    filenamePattern,
    showQrMarginWarn,
    showLinearMarginWarn,
    formatValidation,
    canDownload,
    batchLines,
    canBatchZipFn,
    downloadFile,
    copyOutput,
    copyDataUrl,
    fillCurrentTabUrl,
    resetFields,
    downloadBatchZip,
    pickRecent,
    clearRecent,
    onCsvImport,
  }
}
