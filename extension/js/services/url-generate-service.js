class UrlGenerateService {
  constructor(textarea, modelSelector) {
    this.textarea = textarea;
    this.modelSelector = modelSelector;
  }
  
  subscribeToListeners() {
    chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
      if (message && message.action === 'getGenerateUrl') {
        const prompt = await this.textarea.getPrompt();
        const modelQuery = await this.modelSelector.getCurrentModelQuery();
        const queryParameter = new QueryParameter({
          prompt: prompt,
          modelQuery: modelQuery,
          isConfirm: !!prompt
        });
        const urlString = queryParameter.buildUrl(window.location);
        sendResponse({ url: urlString });
      }
    });
  }
}
