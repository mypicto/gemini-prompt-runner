import { QueryParameter } from '../utils/query-parameter.js'; 

export class UrlGenerateService {
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
        const queryParameter = QueryParameter.generate({
          prompts: promptVal ? [promptVal] : null,
          modelQuery: modelQueryVal,
          isAutoSend: message.autoSend,
          isUseClipboard: null,
          isRequiredLogin: message.requiredLogin ? true : null
        });
        const urlString = queryParameter.buildUrl(window.location);
        sendResponse({ url: urlString });
      }
    });
  }
}
