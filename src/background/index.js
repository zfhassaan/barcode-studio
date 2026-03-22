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

const CMD_QUEUE_URL = 'queue-current-tab-url'

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== CMD_QUEUE_URL) return
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    const u = tab?.url
    if (u && /^https?:\/\//i.test(u)) {
      await chrome.storage.local.set({ contextPrefillText: u })
    }
  } catch {
    // ignore
  }
})
