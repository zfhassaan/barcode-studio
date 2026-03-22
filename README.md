<p align="center">
  <img src="public/icons/barcode.svg" alt="Barcode Studio logo" width="96" height="96" />
</p>

<h1 align="center">Barcode Studio</h1>

**Barcode Studio** is a [Chrome extension](https://developer.chrome.com/docs/extensions/mv3/) (Manifest V3) that generates **QR codes** and **linear barcodes** from the toolbar popup. Everything runs **locally in the browser**—your payload is not sent to a server.

![Chrome](https://img.shields.io/badge/Chrome-Manifest%20V3-4285F4?logo=googlechrome&logoColor=white)
![Vue](https://img.shields.io/badge/Vue-3-4FC08D?logo=vuedotjs&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)

## What it does

Use the extension icon to open a popup where you can:

- Choose a **symbology** (QR code or linear formats such as CODE128, CODE39, EAN-13, EAN-8, UPC-A, ITF-14, Codabar).
- Enter **payload** text—or, for QR, switch to **Wi‑Fi** mode to build a standard `WIFI:…` string.
- Tune **QR options** (error correction, quiet margin, colors, export size) or **linear options** (quiet margin, human-readable text under bars).
- **Preview** the barcode, then move to the **Export** tab to copy or download.
- Export as **PNG**, **JPEG**, **WebP**, or **SVG**; optional **data URL** copy; configurable **filename patterns**.
- **Batch export**: multiple lines → **ZIP** of files using the same format and file type.

The UI uses **Create** and **Export** tabs, light/dark/**system** theme, and an **About** panel (info icon) with privacy notes and links to report issues or request features.

## Privacy

Generation uses **JavaScript libraries inside the extension**. Data you type stays on your machine unless you explicitly copy or download it. There is no backend service for encoding.

## Tech stack

| Area | Technology |
|------|------------|
| UI | [Vue 3](https://vuejs.org/) (Composition API, `<script setup>`) |
| Build | [Vite 7](https://vitejs.dev/) + [@crxjs/vite-plugin](https://crxjs.dev/vite-plugin) |
| QR | [qrcode](https://www.npmjs.com/package/qrcode) |
| Linear | [jsbarcode](https://github.com/lindell/JsBarcode) |
| Batch ZIP | [jszip](https://stuk.github.io/jszip/) |
| Icons | [sharp](https://sharp.pixelplumbing.com/) (dev script to rasterize SVG) |

## Repository layout

```
├── manifest.json              # MV3 manifest (name, permissions, commands)
├── vite.config.js
├── scripts/generate-icons.mjs # PNG icons from public/icons/barcode.svg
├── public/icons/
├── src/
│   ├── background/index.js    # Service worker: context menu, command, storage prefill
│   └── popup/                 # Vue popup app
│       ├── App.vue
│       ├── main.js
│       ├── constants.js
│       ├── composables/useBarcodeGenerator.js
│       ├── components/
│       └── styles/
└── dist/                      # Production build output (after npm run build)
```

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- npm

### Install

```bash
npm install
```

### Run in dev (HMR for the popup)

```bash
npm run dev
```

Follow the URL or instructions from the Vite / CRX plugin output to load the extension in developer mode.

### Production build

```bash
npm run build
```

Output is written to **`dist/`**. That folder is what you **Load unpacked** in Chrome or zip for the [Chrome Web Store](https://chrome.google.com/webstore/devconsole).

### Regenerate toolbar icons

```bash
npm run icons
```

## Load the extension locally

1. Run `npm run build`.
2. Open `chrome://extensions`.
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select the **`dist`** directory.

## Keyboard shortcut

The manifest defines a command **Queue current tab URL** (suggested: **Ctrl+Shift+U** / **⌘⇧U** on Mac). Assign or change it under **Chrome → Extensions → Keyboard shortcuts** (`chrome://extensions/shortcuts`). When triggered, the active tab’s HTTP(S) URL is stored; opening the popup and using **Use tab URL** applies it.

## Context menu

With text selected on a page, the context menu item **“Use selection as barcode text”** stores the selection so the popup can pick it up (same storage pattern as the tab-URL queue).

## Permissions (why they exist)

| Permission | Purpose |
|------------|---------|
| `storage` | Save settings, recent values, queued URL/selection |
| `clipboardWrite` | Copy image / data URL to clipboard |
| `contextMenus` | “Use selection as barcode text” |
| `activeTab` | Read the active tab URL when using tab URL or the keyboard command |

## Contributing

Issues and feature requests are welcome via [GitHub Issues](https://github.com/zfhassaan/barcode-studio/issues).

## License

SPDX: **ISC** — see [`package.json`](./package.json). If the repo includes a `LICENSE` file (e.g. on GitHub), prefer that file when they differ.

---

**Barcode Studio** — QR & linear barcodes in one click from the toolbar.
