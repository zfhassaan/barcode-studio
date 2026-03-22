/** @typedef {'png'|'jpeg'|'webp'|'svg'} DownloadKind */

export const STORAGE = {
  text: 'barcodeGenText',
  format: 'barcodeGenFormat',
  downloadKind: 'barcodeDownloadKind',
  qrEc: 'barcodeGenQrEc',
  qrMargin: 'barcodeGenQrMargin',
  qrDark: 'barcodeGenQrDark',
  qrLight: 'barcodeGenQrLight',
  linearMargin: 'barcodeGenLinearMargin',
  sizePreset: 'barcodeGenSizePreset',
  theme: 'barcodeGenTheme',
  recent: 'barcodeRecent',
  batch: 'barcodeBatchText',
}

export const DOWNLOAD_KINDS = [
  { value: 'png', label: 'PNG', ext: 'png' },
  { value: 'jpeg', label: 'JPEG', ext: 'jpg' },
  { value: 'webp', label: 'WebP', ext: 'webp' },
  { value: 'svg', label: 'SVG', ext: 'svg' },
]

export const FORMATS = [
  { value: 'qrcode', label: 'QR code' },
  { value: 'CODE128', label: 'CODE128' },
  { value: 'CODE39', label: 'CODE39' },
  { value: 'EAN13', label: 'EAN-13' },
  { value: 'EAN8', label: 'EAN-8' },
  { value: 'UPC', label: 'UPC-A' },
  { value: 'ITF', label: 'ITF-14' },
  { value: 'codabar', label: 'Codabar' },
]

export const SIZE_PRESETS = [
  { value: 'small', label: 'Small (128px)', px: 128 },
  { value: 'medium', label: 'Medium (256px)', px: 256 },
  { value: 'large', label: 'Large (512px)', px: 512 },
]

export const QR_EC_LEVELS = [
  { value: 'L', label: 'L — ~7%' },
  { value: 'M', label: 'M — ~15%' },
  { value: 'Q', label: 'Q — ~25%' },
  { value: 'H', label: 'H — ~30%' },
]

export const BARCODE_W = 320
export const BARCODE_H = 140

export function isValidDownloadKind(v) {
  return typeof v === 'string' && DOWNLOAD_KINDS.some((d) => d.value === v)
}

export function isValidFormat(v) {
  return typeof v === 'string' && FORMATS.some((f) => f.value === v)
}

export function formatLabel(value) {
  return FORMATS.find((f) => f.value === value)?.label || value || 'barcode'
}

export function sanitizeFilename(s) {
  return String(s).slice(0, 40).replace(/[^\w.-]+/g, '_') || 'item'
}
