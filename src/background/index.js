// background/index.js
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed')
})

chrome.action.onClicked.addListener((tab) => {
  console.log('Clicked', tab.id)
})
