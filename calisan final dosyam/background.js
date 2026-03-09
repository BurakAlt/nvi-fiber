/**
 * FiberPlan Background Service Worker
 * Handles tab screenshot capture for geo-positioned topology view
 */

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  if (msg.action === 'captureTab') {
    chrome.tabs.captureVisibleTab(sender.tab.windowId, {
      format: 'jpeg',
      quality: 70
    }, function(dataUrl) {
      if (chrome.runtime.lastError) {
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ screenshot: dataUrl });
      }
    });
    return true; // async response
  }
});
