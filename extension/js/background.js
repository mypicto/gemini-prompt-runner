class BackgroundHandler {
  constructor() {
    this.pendingParameters = this.#generateEmptyParameters();
    this.params = ['ext-q', 'ext-m', 'ext-send', 'ext-clipboard'];
  }
  
  init() {
    this.#registerWebRequestListener();
    this.#registerMessageListener();
  }

  #generateEmptyParameters() {
    return {
      prompts: null,
      model: null,
      audosend: null,
      clipboard: null
    };
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
        prompts: url.searchParams.getAll('ext-q'),
        model: url.searchParams.get('ext-m'),
        send: url.searchParams.get('ext-send'),
        clipboard: url.searchParams.get('ext-clipboard')
      };
    }
  }
  
  #handleMessage(message, sender, sendResponse) {
    if (message.type === 'requestParameters') {
      sendResponse(this.pendingParameters);
      this.pendingParameters = this.#generateEmptyParameters();;
      return true;
    }
  }
}

const backgroundHandler = new BackgroundHandler();
backgroundHandler.init();
