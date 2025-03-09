class BackgroundHandler {
  constructor() {
    this.pendingParameters = null;
    this.params = ['ext-q', 'ext-m', 'ext-confirm', 'ext-clipboard'];
  }
  
  init() {
    this.#registerWebRequestListener();
    this.#registerMessageListener();
  }
  
  #getUrlFilters() {
    const filters = [];
    this.params.forEach(param => {
      filters.push(`*://gemini.google.com/*?${param}=*`);
      filters.push(`*://gemini.google.com/*&${param}=*`);
    });
    return filters;
  }
  
  #registerWebRequestListener() {
    if (chrome.webRequest && chrome.webRequest.onBeforeRequest) {
      chrome.webRequest.onBeforeRequest.addListener(this.#handleWebRequest.bind(this), { urls: this.#getUrlFilters() });
    } else {
      console.error('chrome.webRequest is not available in this context.');
    }
  }
  
  #registerMessageListener() {
    chrome.runtime.onMessage.addListener(this.#handleMessage.bind(this));
  }
  
  #handleWebRequest(details) {
    const url = new URL(details.url);
    if (this.params.some(param => url.searchParams.has(param))) {
      this.pendingParameters = {
        prompt: url.searchParams.get('ext-q'),
        model: url.searchParams.get('ext-m'),
        confirm: url.searchParams.get('ext-confirm'),
        clipboard: url.searchParams.get('ext-clipboard')
      };
    }
  }
  
  #handleMessage(message, sender, sendResponse) {
    if (message.type === 'requestParameters') {
      sendResponse(this.pendingParameters);
      this.pendingParameters = null;
      return true;
    }
  }
}

const backgroundHandler = new BackgroundHandler();
backgroundHandler.init();
