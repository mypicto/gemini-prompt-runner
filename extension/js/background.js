class TabIconCache {
  constructor() {
    this.iconPaths = {};
  }

  set(tabId, iconPath) {
    this.iconPaths[tabId] = iconPath;
  }

  get(tabId) {
    return this.iconPaths[tabId];
  }

  remove(tabId) {
    delete this.iconPaths[tabId];
  }
}

class BackgroundHandler {
  constructor() {
    this.pendingParameters = this.#generateEmptyParameters();
    this.params = ['ext-q', 'ext-m', 'ext-send', 'ext-clipboard'];
    this.tabIconCache = new TabIconCache();
  }
  
  init() {
    this.#registerWebRequestListener();
    this.#registerMessageListener();
    this.#registerUpdateIconListener();
    this.#registerTabActivationListener();
    this.#registerTabRemovedListener();
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

  #registerUpdateIconListener() {
    chrome.runtime.onMessage.addListener(this.#handleUpdateIcon.bind(this));
  }

  #registerTabActivationListener() {
    chrome.tabs.onActivated.addListener(this.#handleTabActivation.bind(this));
  }

  #registerTabRemovedListener() {
    chrome.tabs.onRemoved.addListener(this.#handleTabRemoved.bind(this));
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
      this.pendingParameters = this.#generateEmptyParameters();
      return true;
    }
  }

  #handleUpdateIcon(message, sender, sendResponse) {
    if (message.type === 'updateIcon') {
      const tabId = sender.tab?.id;
      chrome.action.setIcon({ tabId: tabId, path: message.iconPath }, () => {
        if (chrome.runtime.lastError) {
          console.error('Failed to set icon:', chrome.runtime.lastError.message, 'Path:', message.iconPath);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          if (tabId !== undefined) {
            this.tabIconCache.set(tabId, message.iconPath);
          }
          sendResponse({ success: true });
        }
      });
      return true; // 非同期処理があるため true を返す
    }
  }

  #handleTabActivation(activeInfo) {
    const tabId = activeInfo.tabId;
    const iconPath = this.tabIconCache.get(tabId) || '../images/icon48.png';
    chrome.action.setIcon({ tabId: tabId, path: iconPath }, () => {
      if (chrome.runtime.lastError) {
        console.error('Failed to restore icon on tab activation:', chrome.runtime.lastError.message, 'Path:', iconPath);
      }
    });
  }

  #handleTabRemoved(tabId, removeInfo) {
    this.tabIconCache.remove(tabId);
  }
}

const backgroundHandler = new BackgroundHandler();
backgroundHandler.init();
