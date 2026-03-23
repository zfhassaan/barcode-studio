<script setup>
import { ref, watch, onUnmounted, nextTick, computed } from 'vue'
import { useBarcodeGenerator } from './composables/useBarcodeGenerator.js'
import {
  FORMATS,
  DOWNLOAD_KINDS,
  QR_EC_LEVELS,
  SIZE_PRESETS,
  FILENAME_PATTERNS,
  WIFI_SECURITY,
  FEEDBACK_URLS,
} from './constants.js'
import AppHeader from './components/AppHeader.vue'
import SectionCard from './components/SectionCard.vue'

const activeTab = ref('create')
const infoOpen = ref(false)
const infoCloseRef = ref(null)
const extensionVersion = chrome?.runtime?.getManifest?.().version || ''

function closeInfo() {
  infoOpen.value = false
}

function onInfoKeydown(e) {
  if (e.key === 'Escape') closeInfo()
}

watch(infoOpen, async (open) => {
  if (open) {
    document.addEventListener('keydown', onInfoKeydown)
    await nextTick()
    infoCloseRef.value?.focus()
  } else {
    document.removeEventListener('keydown', onInfoKeydown)
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', onInfoKeydown)
})

const {
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
} = useBarcodeGenerator()

const FORMAT_HELP = {
  qrcode: {
    what: 'QR code selected. Good for URL, text, contact, or Wi-Fi payloads.',
    example: 'https://example.com/page',
    rule: 'Any non-empty text is valid. Tip: use "Use tab URL" for quick QR content.',
  },
  CODE128: {
    what: 'CODE128 selected. High-density general-purpose barcode.',
    example: 'INV-2026-00421',
    rule: 'Use printable ASCII text. Best for IDs, SKUs, and internal labels.',
  },
  CODE39: {
    what: 'CODE39 selected. Legacy alphanumeric format.',
    example: 'PART-1234-A',
    rule: 'Allowed chars: A-Z, 0-9, space, and - . $ / + %',
  },
  EAN13: {
    what: 'EAN-13 selected. Retail product barcode.',
    example: '590123412345',
    rule: 'Enter 12 or 13 digits.',
  },
  EAN8: {
    what: 'EAN-8 selected. Compact retail barcode.',
    example: '9638507',
    rule: 'Enter 7 or 8 digits.',
  },
  UPC: {
    what: 'UPC-A selected. Common in North America.',
    example: '03600029145',
    rule: 'Enter 11 or 12 digits.',
  },
  ITF: {
    what: 'ITF-14 selected. Packaging and carton labels.',
    example: '00123456789012',
    rule: 'Digits only, and length must be even.',
  },
  codabar: {
    what: 'Codabar selected. Libraries and logistics legacy format.',
    example: 'A123456B',
    rule: 'Use A/B/C/D as start/end with valid inner characters.',
  },
}

const selectedFormatLabel = computed(
  () => FORMATS.find((f) => f.value === format.value)?.label || '',
)

const selectedFormatHelp = computed(() => FORMAT_HELP[format.value] || null)

const contentSectionDescription = computed(() => {
  if (!format.value) return 'What to encode - text, URL, product ID, or Wi-Fi for QR.'
  if (format.value === 'qrcode') return 'QR content: text, URL, contact info, or Wi-Fi payload.'
  if (format.value === 'CODE128') return 'CODE128 content: IDs, SKUs, tracking numbers, or mixed ASCII text.'
  if (format.value === 'CODE39') return 'CODE39 content: uppercase letters, digits, and basic symbols.'
  if (format.value === 'EAN13') return 'EAN-13 content: product code digits (12 or 13 digits).'
  if (format.value === 'EAN8') return 'EAN-8 content: compact retail code digits (7 or 8 digits).'
  if (format.value === 'UPC') return 'UPC-A content: retail UPC digits (11 or 12 digits).'
  if (format.value === 'ITF') return 'ITF content: carton/packaging digits with even length.'
  if (format.value === 'codabar') return 'Codabar content: starts/ends with A-D for legacy labels.'
  return 'Enter content for the selected symbology.'
})

const payloadPlaceholder = computed(() => {
  if (!format.value) return 'Paste or type your data...'
  return selectedFormatHelp.value?.example || 'Paste or type your data...'
})

</script>

<template>
  <div class="shell" :data-theme="theme">
    <div class="shell__accent" aria-hidden="true" />
    <div class="shell__sticky">
      <AppHeader v-model:theme="theme" :version="extensionVersion" @open-info="infoOpen = true" />

      <nav class="tab-bar" role="tablist" aria-label="Sections">
        <button id="tab-create" type="button" class="tab-bar__btn" role="tab" :aria-selected="activeTab === 'create'"
          :tabindex="activeTab === 'create' ? 0 : -1" aria-controls="panel-create" @click="activeTab = 'create'">
          <span class="tab-bar__label">Create</span>
          <span class="tab-bar__hint">Format &amp; preview</span>
        </button>
        <button id="tab-export" type="button" class="tab-bar__btn" role="tab" :aria-selected="activeTab === 'export'"
          :tabindex="activeTab === 'export' ? 0 : -1" aria-controls="panel-export" @click="activeTab = 'export'">
          <span class="tab-bar__label">Export</span>
          <span class="tab-bar__hint">Save &amp; batch</span>
        </button>
      </nav>
    </div>

    <main class="shell__main">
      <div v-show="activeTab === 'create'" id="panel-create" class="tab-panel" role="tabpanel"
        aria-labelledby="tab-create">
        <SectionCard title="1 · Symbology" description="Choose QR or a linear barcode standard first.">
          <label class="u-label" for="bc-format">Format <abbr class="req" title="required">*</abbr></label>
          <div class="u-select-wrap">
            <select id="bc-format" v-model="format" class="u-select" required aria-required="true">
              <option disabled value="">Choose format…</option>
              <option v-for="f in FORMATS" :key="f.value" :value="f.value">{{ f.label }}</option>
            </select>
          </div>
          <div v-if="format" class="format-preview">
            <p class="format-preview__line">
              <span class="format-preview__chip">Selected</span>
              <strong>{{ selectedFormatLabel }}</strong>
            </p>
            <p class="format-preview__text">{{ selectedFormatHelp?.what }}</p>
            <p class="format-preview__text format-preview__text--sub">
              Rule: {{ selectedFormatHelp?.rule }}
            </p>
            <p class="format-preview__text format-preview__text--sub">
              Example: <code class="code">{{ selectedFormatHelp?.example }}</code>
            </p>
            <p class="format-preview__status" :class="formatValidation.ok ? 'is-ok' : 'is-bad'">
              {{ formatValidation.text }}
            </p>
          </div>
        </SectionCard>

        <SectionCard title="2 · Content" :description="contentSectionDescription">
          <div v-if="format === 'qrcode'" class="toolbar-row">
            <button type="button" class="btn btn--ghost btn--sm" @click="fillCurrentTabUrl">
              Use tab URL
            </button>
            <button type="button" class="btn btn--ghost btn--sm" @click="resetFields">Reset all</button>
          </div>
          <p class="hint hint--tight">More tips and shortcuts are under the info button in the header.</p>

          <div v-if="format === 'qrcode'" class="payload-seg" role="group" aria-label="QR payload type">
            <button type="button" class="payload-seg__btn" :class="{ 'payload-seg__btn--on': payloadMode === 'plain' }"
              @click="payloadMode = 'plain'">
              Plain text
            </button>
            <button type="button" class="payload-seg__btn" :class="{ 'payload-seg__btn--on': payloadMode === 'wifi' }"
              @click="payloadMode = 'wifi'">
              Wi‑Fi
            </button>
          </div>

          <template v-if="format !== 'qrcode' || payloadMode === 'plain'">
            <label class="u-label" for="bc-text">Payload</label>
            <textarea id="bc-text" v-model="text" class="u-textarea" rows="3" spellcheck="false"
              :placeholder="payloadPlaceholder" />
          </template>

          <template v-else>
            <p class="u-label">Wi‑Fi QR (payload is generated)</p>
            <label class="u-label" for="wf-ssid">Network name (SSID)</label>
            <input id="wf-ssid" v-model="wifiSsid" class="u-input" type="text" autocomplete="off" />
            <label class="u-label" for="wf-sec">Security</label>
            <div class="u-select-wrap">
              <select id="wf-sec" v-model="wifiSecurity" class="u-select">
                <option v-for="w in WIFI_SECURITY" :key="w.value" :value="w.value">{{ w.label }}</option>
              </select>
            </div>
            <label class="u-label" for="wf-pass">Password</label>
            <input id="wf-pass" v-model="wifiPassword" class="u-input" type="password" autocomplete="off"
              :disabled="wifiSecurity === 'nopass'" />
            <label class="u-check">
              <input v-model="wifiHidden" type="checkbox" />
              Hidden network
            </label>
          </template>

          <div v-if="recent.length" class="recent">
            <div class="recent__head">
              <span class="recent__label">Recent</span>
              <button type="button" class="recent__clear" @click="clearRecent">Clear</button>
            </div>
            <div class="recent__chips">
              <button v-for="(r, i) in recent" :key="i + r" type="button" class="chip" :title="r"
                @click="pickRecent(r)">
                {{ r.length > 30 ? `${r.slice(0, 30)}…` : r }}
              </button>
            </div>
          </div>
        </SectionCard>

        <SectionCard v-show="format === 'qrcode'" title="3 · QR options"
          description="Error correction, quiet zone, colors, and export size.">
          <label class="u-label" for="bc-ec">Error correction</label>
          <div class="u-select-wrap">
            <select id="bc-ec" v-model="qrEcLevel" class="u-select">
              <option v-for="e in QR_EC_LEVELS" :key="e.value" :value="e.value">{{ e.label }}</option>
            </select>
          </div>
          <div class="u-row">
            <label class="u-label u-label--inline" for="bc-qm">Quiet margin (modules)</label>
            <span class="u-val">{{ qrMargin }}</span>
          </div>
          <input id="bc-qm" v-model.number="qrMargin" class="u-range" type="range" min="1" max="4" step="1" />
          <p v-if="showQrMarginWarn" class="warn">Low quiet zone — scanners may fail; try margin ≥ 2.</p>
          <div class="u-colors">
            <div>
              <label class="u-label" for="c-dark">Modules</label>
              <input id="c-dark" v-model="qrDark" type="color" class="u-color" />
            </div>
            <div>
              <label class="u-label" for="c-light">Background</label>
              <input id="c-light" v-model="qrLight" type="color" class="u-color" />
            </div>
          </div>
          <label class="u-label" for="bc-size">Preview &amp; export size</label>
          <div class="u-select-wrap">
            <select id="bc-size" v-model="sizePreset" class="u-select">
              <option v-for="s in SIZE_PRESETS" :key="s.value" :value="s.value">{{ s.label }}</option>
            </select>
          </div>
        </SectionCard>

        <SectionCard v-show="format && format !== 'qrcode'" title="3 · Linear options"
          description="Quiet zone and whether to show digits under the bars.">
          <div class="u-row">
            <label class="u-label u-label--inline" for="bc-lm">Quiet margin</label>
            <span class="u-val">{{ linearMargin }}px</span>
          </div>
          <input id="bc-lm" v-model.number="linearMargin" class="u-range" type="range" min="4" max="24" step="1" />
          <p v-if="showLinearMarginWarn" class="warn">Low quiet zone — increase margin for reliable scans.</p>
          <label class="u-check u-check--block">
            <input v-model="linearShowText" type="checkbox" />
            Show human-readable text under bars
          </label>
        </SectionCard>

        <p v-if="format && format !== 'qrcode'" class="hint hint--block">
          Linear lengths: EAN-13 — 12 digits (check digit added). EAN-8 — 7. UPC — 11. ITF-14 — even count of digits.
        </p>

        <SectionCard title="Preview" :dense="true" description="Updates as you edit — switch to Export when ready.">
          <div class="preview" :class="format === 'qrcode' ? 'preview--qr' : 'preview--barcode'"
            :style="format === 'qrcode' ? { width: `${presetPx}px`, height: `${presetPx}px` } : undefined">
            <canvas ref="canvasRef" class="preview__canvas"
              :style="format === 'qrcode' ? { width: `${presetPx}px`, height: `${presetPx}px` } : undefined" />
          </div>
          <p v-if="error && text.trim() && format" class="err" role="alert">{{ error }}</p>
          <button type="button" class="btn btn--primary btn--full" @click="activeTab = 'export'">
            Next: export &amp; save
          </button>
        </SectionCard>
      </div>

      <div v-show="activeTab === 'export'" id="panel-export" class="tab-panel" role="tabpanel"
        aria-labelledby="tab-export">
        <SectionCard title="Export" description="Pick file type and name, then copy or download.">
          <label class="u-label" for="bc-download">File type</label>
          <div class="u-select-wrap">
            <select id="bc-download" v-model="downloadKind" class="u-select">
              <option v-for="d in DOWNLOAD_KINDS" :key="d.value" :value="d.value">{{ d.label }}</option>
            </select>
          </div>
          <label class="u-label" for="fn-pat">Filename pattern</label>
          <div class="u-select-wrap">
            <select id="fn-pat" v-model="filenamePattern" class="u-select">
              <option v-for="p in FILENAME_PATTERNS" :key="p.value" :value="p.value">{{ p.label }}</option>
            </select>
          </div>
          <div class="actions actions--3">
            <button type="button" class="btn btn--ghost" :disabled="!canDownload()" @click="copyOutput">
              Copy
            </button>
            <button type="button" class="btn btn--ghost" :disabled="!canDownload()" @click="copyDataUrl">
              Data URL
            </button>
            <button type="button" class="btn btn--primary" :disabled="!canDownload()" @click="downloadFile">
              Download
            </button>
          </div>
          <p v-if="copyStatus" class="toast">{{ copyStatus }}</p>
        </SectionCard>

        <SectionCard title="Batch export"
          description="One value per line — uses the same format and file type as above." dense>
          <label class="u-label" for="batch">Lines</label>
          <textarea id="batch" v-model="batchText" class="u-textarea" rows="3" placeholder="Line 1&#10;Line 2&#10;…" />
          <div class="batch-actions">
            <label class="btn btn--ghost btn--file">
              Import .txt / .csv
              <input type="file" accept=".txt,.csv,text/plain,text/csv" class="visually-hidden" @change="onCsvImport" />
            </label>
            <button type="button" class="btn btn--primary" :disabled="!canBatchZipFn()" @click="downloadBatchZip">
              ZIP all
            </button>
          </div>
        </SectionCard>
      </div>

      <p class="privacy">Generation runs locally in your browser — payload is not sent to a server.</p>

      <footer class="signature" aria-label="Author and feedback">
        <span class="signature__text">Built with care by</span>
        <a class="signature__link" href="https://github.com/zfhassaan" target="_blank" rel="noopener noreferrer">
          zfhassaan
        </a>
        <span class="signature__sep" aria-hidden="true">·</span>
        <a class="signature__link signature__link--sub" :href="FEEDBACK_URLS.reportIssue" target="_blank"
          rel="noopener noreferrer">Report</a>
        <span class="signature__sep" aria-hidden="true">·</span>
        <a class="signature__link signature__link--sub" :href="FEEDBACK_URLS.featureRequest" target="_blank"
          rel="noopener noreferrer">Feature</a>
      </footer>
    </main>

    <Teleport to="body">
      <div v-if="infoOpen" class="info-overlay" role="presentation" @click.self="closeInfo">
        <div class="info-dialog" role="dialog" aria-modal="true" aria-labelledby="info-title" tabindex="-1">
          <div class="info-dialog__head">
            <h2 id="info-title" class="info-dialog__title">About</h2>
            <button ref="infoCloseRef" type="button" class="info-dialog__close" aria-label="Close" @click="closeInfo">
              <span aria-hidden="true">×</span>
            </button>
          </div>
          <div class="info-dialog__body">
            <p class="info-dialog__lead">
              Create QR and linear barcodes in your browser — no accounts or cloud upload.
            </p>

            <section class="info-block">
              <h3 class="info-block__title">Privacy</h3>
              <p class="info-block__text">Everything runs locally. Your payload stays on your device.</p>
            </section>

            <section class="info-block">
              <h3 class="info-block__title">Keyboard shortcut</h3>
              <p class="info-block__text">
                You can assign <strong>Queue current tab URL</strong> in
                <code class="code">chrome://extensions/shortcuts</code>, then open this popup and use
                <strong>Use tab URL</strong> on the Create tab.
              </p>
            </section>

            <section class="info-block">
              <h3 class="info-block__title">Feedback</h3>
              <p class="info-block__text info-block__text--tight">
                Open GitHub to report bugs or suggest improvements.
              </p>
              <div class="info-feedback">
                <a
                  class="info-feedback__btn"
                  :href="FEEDBACK_URLS.reportIssue"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Report an issue
                </a>
                <a
                  class="info-feedback__btn info-feedback__btn--primary"
                  :href="FEEDBACK_URLS.featureRequest"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Request a feature
                </a>
              </div>
            </section>

            <section class="info-block">
              <h3 class="info-block__title">Author</h3>
              <p class="info-block__text">
                Made by
                <a href="https://github.com/zfhassaan" target="_blank" rel="noopener noreferrer" class="info-link">
                  zfhassaan
                </a>
                — feedback and issues are welcome on GitHub.
              </p>
            </section>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.shell__sticky {
  position: sticky;
  top: 0;
  z-index: 5;
  background: var(--bc-bg);
  border-bottom: 1px solid var(--bc-border);
}

.tab-bar {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 0 18px 12px;
  margin-top: 10px;
}

.tab-bar__btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 10px 12px;
  border: 1px solid var(--bc-border);
  border-radius: var(--bc-radius-md);
  background: var(--bc-panel);
  color: var(--bc-muted);
  cursor: pointer;
  text-align: left;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    color 0.15s ease;
}

.tab-bar__btn[aria-selected='true'] {
  background: var(--bc-card);
  border-color: var(--bc-accent);
  color: var(--bc-fg);
  box-shadow: var(--bc-shadow-sm);
}

.tab-bar__btn:hover {
  border-color: var(--bc-accent);
  color: var(--bc-fg);
}

.tab-bar__btn:focus-visible {
  outline: none;
  box-shadow: var(--bc-focus);
}

.tab-bar__label {
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.tab-bar__hint {
  font-size: 0.65rem;
  font-weight: 500;
  opacity: 0.85;
}

.tab-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.info-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: white !important;
}

.info-dialog {
  width: min(100%, 380px);
  max-height: min(90vh, 520px);
  overflow: auto;
  border-radius: var(--bc-radius-lg);
  border: 1px solid var(--bc-border);
  background: var(--bc-card);
  box-shadow: var(--bc-shadow-md);
  color: var(--bc-fg);
}

.info-dialog__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--bc-border);
  position: sticky;
  top: 0;
  background: var(--bc-card);
  z-index: 1;
}

.info-dialog__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.info-dialog__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: var(--bc-radius-sm);
  background: transparent;
  color: var(--bc-muted);
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.info-dialog__close:hover {
  background: var(--bc-panel);
  color: var(--bc-fg);
}

.info-dialog__close:focus-visible {
  outline: none;
  box-shadow: var(--bc-focus);
}

.info-dialog__body {
  padding: 14px 16px 18px;
}

.info-dialog__lead {
  margin: 0 0 14px;
  font-size: 0.84rem;
  line-height: 1.5;
  color: var(--bc-muted);
}

.info-block {
  margin-bottom: 14px;
}

.info-block:last-child {
  margin-bottom: 0;
}

.info-block__title {
  margin: 0 0 6px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--bc-muted);
}

.info-block__text {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--bc-fg);
}

.info-block__text--tight {
  margin-bottom: 8px;
}

.info-feedback {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}

.info-feedback__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 0 14px;
  border-radius: var(--bc-radius-md);
  border: 1px solid var(--bc-border);
  background: var(--bc-panel);
  color: var(--bc-fg);
  font-size: 0.78rem;
  font-weight: 600;
  text-decoration: none;
  text-align: center;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.info-feedback__btn:hover {
  border-color: var(--bc-accent);
  background: var(--bc-accent-soft);
}

.info-feedback__btn--primary {
  border-color: transparent;
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  color: #fff;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
}

.info-feedback__btn--primary:hover {
  filter: brightness(1.05);
}

.info-feedback__btn:focus-visible {
  outline: none;
  box-shadow: var(--bc-focus);
}

.info-link {
  font-weight: 700;
  color: var(--bc-accent-text);
  text-decoration: none;
}

.info-link:hover {
  text-decoration: underline;
}

.info-link:focus-visible {
  outline: none;
  border-radius: 4px;
  box-shadow: var(--bc-focus);
}

.btn--full {
  width: 100%;
  margin-top: 12px;
  flex: none;
}

.hint--block {
  margin: 0;
  padding: 0 2px 4px;
}

.req {
  color: #f43f5e;
  text-decoration: none;
}

.u-label {
  display: block;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--bc-muted);
  margin-bottom: 6px;
}

.u-label--inline {
  margin-bottom: 0;
}

.u-textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border: 1px solid var(--bc-border);
  border-radius: var(--bc-radius-md);
  font-size: 0.875rem;
  line-height: 1.45;
  resize: vertical;
  min-height: 72px;
  margin-bottom: 0;
  background: var(--bc-elevated);
  color: var(--bc-fg);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.u-textarea:hover {
  border-color: var(--bc-muted);
}

.u-textarea:focus {
  outline: none;
  border-color: var(--bc-accent);
  box-shadow: var(--bc-focus);
}

.u-input {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  margin-bottom: 10px;
  border: 1px solid var(--bc-border);
  border-radius: var(--bc-radius-md);
  font-size: 0.875rem;
  background: var(--bc-elevated);
  color: var(--bc-fg);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.u-input:hover:not(:disabled) {
  border-color: var(--bc-muted);
}

.u-input:focus:not(:disabled) {
  outline: none;
  border-color: var(--bc-accent);
  box-shadow: var(--bc-focus);
}

.u-input:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.toolbar-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 6px;
}

.payload-seg {
  display: flex;
  gap: 0;
  margin: 10px 0 12px;
  padding: 3px;
  border-radius: var(--bc-radius-md);
  border: 1px solid var(--bc-border);
  background: var(--bc-panel);
}

.payload-seg__btn {
  flex: 1;
  min-height: 34px;
  padding: 0 10px;
  font-size: 0.75rem;
  font-weight: 600;
  border: none;
  border-radius: calc(var(--bc-radius-md) - 2px);
  background: transparent;
  color: var(--bc-muted);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.payload-seg__btn:hover {
  color: var(--bc-fg);
}

.payload-seg__btn--on {
  background: var(--bc-elevated);
  color: var(--bc-fg);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

.u-check {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  color: var(--bc-muted);
  cursor: pointer;
}

.u-check input {
  accent-color: var(--bc-accent);
}

.u-check--block {
  display: flex;
  margin-top: 8px;
}

.warn {
  font-size: 0.72rem;
  line-height: 1.4;
  color: #fbbf24;
  margin: -8px 0 10px;
}

.privacy {
  font-size: 0.68rem;
  line-height: 1.45;
  color: var(--bc-muted);
  text-align: center;
  margin: 12px 8px 0;
  padding: 0 4px;
}

.hint--tight {
  margin-bottom: 8px;
}

.format-preview {
  margin-top: 10px;
  padding: 10px;
  border: 1px solid var(--bc-border);
  border-radius: var(--bc-radius-md);
  background: var(--bc-panel);
}

.format-preview__line {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 6px;
  font-size: 0.78rem;
}

.format-preview__chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  border-radius: var(--bc-radius-full);
  border: 1px solid var(--bc-border);
  background: var(--bc-elevated);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--bc-muted);
}

.format-preview__text {
  margin: 0;
  font-size: 0.74rem;
  line-height: 1.45;
  color: var(--bc-fg);
}

.format-preview__text--sub {
  margin-top: 4px;
  color: var(--bc-muted);
}

.format-preview__status {
  margin: 8px 0 0;
  font-size: 0.73rem;
  font-weight: 600;
}

.format-preview__status.is-ok {
  color: #34d399;
}

.format-preview__status.is-bad {
  color: #f59e0b;
}

.code {
  font-family: ui-monospace, monospace;
  font-size: 0.7em;
  padding: 1px 4px;
  border-radius: 4px;
  background: var(--bc-panel);
  border: 1px solid var(--bc-border);
}

.u-select-wrap {
  margin-bottom: 10px;
}

.u-select {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 36px 10px 12px;
  border: 1px solid var(--bc-border);
  border-radius: var(--bc-radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  background: var(--bc-elevated);
  color: var(--bc-fg);
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.u-select:focus {
  outline: none;
  border-color: var(--bc-accent);
  box-shadow: var(--bc-focus);
}

.u-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.u-val {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--bc-accent-text);
  font-variant-numeric: tabular-nums;
}

.u-range {
  width: 100%;
  margin: 0 0 14px;
  accent-color: var(--bc-accent);
}

.u-colors {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 10px;
}

.u-color {
  width: 100%;
  height: 36px;
  padding: 2px;
  border: 1px solid var(--bc-border);
  border-radius: var(--bc-radius-md);
  background: var(--bc-elevated);
  cursor: pointer;
}

.recent {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--bc-border);
}

.recent__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.recent__label {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--bc-muted);
}

.recent__clear {
  border: none;
  background: none;
  color: var(--bc-accent-text);
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: var(--bc-radius-sm);
}

.recent__clear:hover {
  background: var(--bc-accent-soft);
}

.recent__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  max-width: 100%;
  font-size: 0.72rem;
  font-weight: 500;
  padding: 6px 10px;
  border-radius: var(--bc-radius-full);
  border: 1px solid var(--bc-border);
  background: var(--bc-panel);
  color: var(--bc-fg);
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.chip:hover {
  border-color: var(--bc-accent);
  background: var(--bc-accent-soft);
}

.hint {
  font-size: 0.72rem;
  line-height: 1.45;
  color: var(--bc-muted);
  margin: -4px 0 0;
  padding: 0 2px;
}

.preview {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto;
  padding: 12px;
  border-radius: var(--bc-radius-md);
  background: var(--bc-panel);
  border: 1px solid var(--bc-border);
  overflow: hidden;
}

.preview--barcode {
  width: 320px;
  height: 140px;
}

.preview--barcode .preview__canvas {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
}

.preview--qr .preview__canvas {
  display: block;
}

.err {
  font-size: 0.78rem;
  color: #fb7185;
  margin: 10px 0 0;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}

.actions--3 {
  flex-wrap: wrap;
}

.actions--3 .btn {
  flex: 1 1 calc(33.333% - 7px);
  min-width: 88px;
  min-height: 38px;
  font-size: 0.8125rem;
  padding: 0 10px;
}

.btn--sm {
  min-height: 34px;
  padding: 0 12px;
  font-size: 0.8125rem;
  flex: 0 1 auto;
}

.btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0 16px;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: var(--bc-radius-md);
  border: 1px solid var(--bc-border);
  background: var(--bc-elevated);
  color: var(--bc-fg);
  cursor: pointer;
  transition:
    transform 0.12s ease,
    box-shadow 0.15s ease,
    background 0.15s ease;
}

.btn:hover:not(:disabled) {
  background: var(--bc-panel);
}

.btn:active:not(:disabled) {
  transform: scale(0.98);
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn--ghost {
  background: transparent;
}

.btn--primary {
  border-color: transparent;
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  color: #fff;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.35);
}

.btn--primary:hover:not(:disabled) {
  filter: brightness(1.05);
  background: linear-gradient(135deg, #4f46e5, #6366f1);
}

.btn--primary:disabled {
  box-shadow: none;
}

.batch-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.batch-actions .btn {
  min-width: 120px;
}

.btn--file {
  position: relative;
  cursor: pointer;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

.toast {
  font-size: 0.78rem;
  font-weight: 500;
  color: #34d399;
  margin: 10px 0 0;
  min-height: 1.2em;
}

.btn:focus-visible {
  outline: none;
  box-shadow: var(--bc-focus);
}

.signature {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 4px 4px;
  margin-top: 4px;
  border-top: 1px solid var(--bc-border);
  font-size: 0.72rem;
  color: var(--bc-muted);
}

.signature__text {
  font-weight: 500;
}

.signature__link {
  font-weight: 700;
  color: var(--bc-accent-text);
  text-decoration: none;
}

.signature__link:hover {
  text-decoration: underline;
}

.signature__link:focus-visible {
  outline: none;
  border-radius: 4px;
  box-shadow: var(--bc-focus);
}

.signature__sep {
  opacity: 0.5;
  user-select: none;
}

.signature__link--sub {
  font-weight: 600;
}
</style>
