// Background service worker for Ducky Companion extension

// Initialize default settings on install
chrome.runtime.onInstalled.addListener(async () => {
  await chrome.storage.sync.set({
    mode: 'pet',
    soundEnabled: true,
    duckVisible: true
  });
  console.log('Ducky Companion installed! 🦆');
});

// Handle messages from content scripts if needed
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_SETTINGS') {
    chrome.storage.sync.get({
      mode: 'pet',
      soundEnabled: true,
      duckVisible: true
    }).then(sendResponse);
    return true; // Required for async response
  }
});
