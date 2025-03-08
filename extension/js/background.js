let pendingQParam = null;

if (chrome.webRequest && chrome.webRequest.onBeforeRequest) {
  chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
      const url = new URL(details.url);
      const qParam = url.searchParams.get('q');
      if (qParam) {
        pendingQParam = qParam;
      }
    },
    { urls: ["*://gemini.google.com/*"] }
  );

  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.type === 'listenerReady') {
      if (pendingQParam) {
        sendResponse({ prompt: pendingQParam });
        pendingQParam = null;
      } else {
        sendResponse({});
      }
      return true;
    }
  });
} else {
  console.error('chrome.webRequest is not available in this context.');
}
