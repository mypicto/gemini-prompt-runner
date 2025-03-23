class UrlGenerateService {
  constructor(textarea, modelSelector) {
    this.textarea = textarea;
    this.modelSelector = modelSelector;
  }
  
  subscribeToListeners() {
    chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
      if (message && message.action === 'getGenerateUrl') {
        let promptVal = null;
        let modelQueryVal = null;
        if (message.includePrompt) {
          promptVal = await this.textarea.getPrompt();
        }
        if (message.includeModel) {
          modelQueryVal = await this.modelSelector.getCurrentModelQuery();
        }
        const queryParameter = await QueryParameter.generate({
          prompt: promptVal,
          modelQuery: modelQueryVal,
          isAutoSend: message.autoSend,
          isUseClipboard: null
        });
        const urlString = queryParameter.buildUrl(window.location);
        sendResponse({ url: urlString });
      }
    });
  }
}
