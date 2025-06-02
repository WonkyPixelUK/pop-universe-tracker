// background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CAPTURE_SCREENSHOT') {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      sendResponse({ screenshot: dataUrl });
    });
    return true; // keep the message channel open for sendResponse
  }
}); 