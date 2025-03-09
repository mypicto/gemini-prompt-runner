class BackgroundHandler {
  constructor() {
    this.pendingParameters = null;
  }
  
  init() {
    this.#registerWebRequestListener();
    this.#registerMessageListener();
  }
  
  #getUrlFilters() {
    const params = ['ext-q', 'ext-m', 'ext-confirm'];
    const filters = [];
    params.forEach(param => {
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
    if (url.searchParams.has('ext-q') || url.searchParams.has('ext-m') || url.searchParams.has('ext-confirm')) {
      this.pendingParameters = {
        prompt: url.searchParams.get('ext-q'),
        model: url.searchParams.get('ext-m'),
        confirm: url.searchParams.get('ext-confirm')
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
