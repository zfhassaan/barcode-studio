const MENU_ID = 'barcode_use_selection'

async function ensureContextMenu() {
  try {
    await chrome.contextMenus.removeAll()
    await chrome.contextMenus.create({
      id: MENU_ID,
      title: 'Use selection as barcode text',
      contexts: ['selection'],
    })
  } catch {
    // ignore
  }
}

chrome.runtime.onInstalled.addListener(() => {
  ensureContextMenu()
})

chrome.runtime.onStartup.addListener(() => {
  ensureContextMenu()
})

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId !== MENU_ID || !info.selectionText) return
  chrome.storage.local.set({ contextPrefillText: info.selectionText }).catch(() => {})
})
