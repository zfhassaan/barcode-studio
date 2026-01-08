# Vue.js Chrome Extension Skeleton

This is a bare-minimum skeleton for building modern Chrome Extensions (Manifest V3) using **Vue.js** and **Vite**.

## Purpose

The `skeleton` branch provides the essential boilerplate needed to start a new extension project without any unnecessary features. It includes:

- **Vite** with `@crxjs/vite-plugin` for seamless extension building.
- **Vue 3** for the popup UI.
- Basic **Background** and **Content** script setups.

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Development

Run the dev server to get HMR for the popup:

```bash
npm run dev
```

### 3. Build the Extension

Generate the production-ready files:

```bash
npm run build
```

## Deployment

To use the extension in Chrome:

1. Navigate to `chrome://extensions`.
2. Enable **Developer mode** (toggle in the top right).
3. Click **Load unpacked**.
4. Select the `dist/` folder generated after running `npm run build`.

### Chrome Web Store

When you are ready to publish, the `dist/` folder is exactly what you need to zip and upload to the [Chrome Web Store developer console](https://chrome.google.com/webstore/devconsole).
