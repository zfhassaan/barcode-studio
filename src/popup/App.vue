<script setup>
import { useBarcodeGenerator } from './composables/useBarcodeGenerator.js'
import {
  FORMATS,
  DOWNLOAD_KINDS,
  QR_EC_LEVELS,
  SIZE_PRESETS,
} from './constants.js'
import AppHeader from './components/AppHeader.vue'
import SectionCard from './components/SectionCard.vue'

const {
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
  canBatchZipFn,
  downloadFile,
  copyOutput,
  downloadBatchZip,
  pickRecent,
  clearRecent,
  onCsvImport,
} = useBarcodeGenerator()
</script>

<template>
  <div class="shell" :data-theme="theme">
    <div class="shell__accent" aria-hidden="true" />
    <AppHeader v-model:theme="theme" />

    <main class="shell__main">
      <SectionCard title="Content" description="URLs, SKUs, GTINs, or any text the symbology allows.">
        <label class="u-label" for="bc-text">Payload</label>
        <textarea
          id="bc-text"
          v-model="text"
          class="u-textarea"
          rows="3"
          spellcheck="false"
          placeholder="Paste or type your data…"
        />

        <div v-if="recent.length" class="recent">
          <div class="recent__head">
            <span class="recent__label">Recent</span>
            <button type="button" class="recent__clear" @click="clearRecent">Clear</button>
          </div>
          <div class="recent__chips">
            <button
              v-for="(r, i) in recent"
              :key="i + r"
              type="button"
              class="chip"
              :title="r"
              @click="pickRecent(r)"
            >
              {{ r.length > 30 ? `${r.slice(0, 30)}…` : r }}
            </button>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Symbology" description="Required. Pick QR or a linear standard.">
        <label class="u-label" for="bc-format">Format <abbr class="req" title="required">*</abbr></label>
        <div class="u-select-wrap">
          <select
            id="bc-format"
            v-model="format"
            class="u-select"
            required
            aria-required="true"
          >
            <option disabled value="">Choose format…</option>
            <option v-for="f in FORMATS" :key="f.value" :value="f.value">{{ f.label }}</option>
          </select>
        </div>
      </SectionCard>

      <SectionCard v-show="format === 'qrcode'" title="QR options" description="Error recovery, colors, and output size.">
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

      <SectionCard
        v-show="format && format !== 'qrcode'"
        title="Linear barcode"
        description="Padding around the bars (pixels)."
      >
        <div class="u-row">
          <label class="u-label u-label--inline" for="bc-lm">Quiet margin</label>
          <span class="u-val">{{ linearMargin }}px</span>
        </div>
        <input id="bc-lm" v-model.number="linearMargin" class="u-range" type="range" min="4" max="24" step="1" />
      </SectionCard>

      <p class="hint">
        EAN-13: 12 digits (check digit added). EAN-8: 7 digits. UPC: 11. ITF-14: even number of digits.
      </p>

      <SectionCard title="Preview" :dense="true">
        <div
          class="preview"
          :class="format === 'qrcode' ? 'preview--qr' : 'preview--barcode'"
          :style="format === 'qrcode' ? { width: `${presetPx}px`, height: `${presetPx}px` } : undefined"
        >
          <canvas
            ref="canvasRef"
            class="preview__canvas"
            :style="format === 'qrcode' ? { width: `${presetPx}px`, height: `${presetPx}px` } : undefined"
          />
        </div>
        <p v-if="error && text.trim() && format" class="err" role="alert">{{ error }}</p>
      </SectionCard>

      <SectionCard title="Export" description="File type, then copy or save.">
        <label class="u-label" for="bc-download">File type</label>
        <div class="u-select-wrap">
          <select id="bc-download" v-model="downloadKind" class="u-select">
            <option v-for="d in DOWNLOAD_KINDS" :key="d.value" :value="d.value">{{ d.label }}</option>
          </select>
        </div>
        <div class="actions">
          <button type="button" class="btn btn--ghost" :disabled="!canDownload()" @click="copyOutput">
            Copy
          </button>
          <button type="button" class="btn btn--primary" :disabled="!canDownload()" @click="downloadFile">
            Download
          </button>
        </div>
        <p v-if="copyStatus" class="toast">{{ copyStatus }}</p>
      </SectionCard>

      <SectionCard title="Batch export" description="One value per line · uses symbology &amp; file type above." dense>
        <label class="u-label" for="batch">Lines</label>
        <textarea
          id="batch"
          v-model="batchText"
          class="u-textarea"
          rows="3"
          placeholder="Line 1&#10;Line 2&#10;…"
        />
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
    </main>
  </div>
</template>

<style scoped>
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
</style>
