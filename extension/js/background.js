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

class InternalMessageHandler {
  constructor() {
    this.pendingParameters = this.#generateEmptyParameters();
    this.params = ['ext-q', 'ext-m', 'ext-send', 'ext-clipboard', 'ext-required-login'];
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
      autosend: null,
      clipboard: null,
      requiredLogin: null
    };
  }
  
  #getUrlFilters() {
    const filters = [];
    this.params.forEach(param => {
      filters.push(`*://gemini.google.com/*`);
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
    const queryParams = this.#extractQueryParameters(url);
    const fragmentParams = this.#extractFragmentParameters(url);

    if (this.#hasTargetParameters(queryParams, fragmentParams)) {
      this.pendingParameters = this.#mergeParameters(queryParams, fragmentParams);
    }
  }

  #extractQueryParameters(url) {
    return url.searchParams;
  }

  #extractFragmentParameters(url) {
    if (url.hash && url.hash.length > 1) {
      const decodedHash = decodeURIComponent(url.hash.substring(1));
      return new URLSearchParams(decodedHash);
    }
    return new URLSearchParams();
  }

  #hasTargetParameters(queryParams, fragmentParams) {
    return this.params.some(param => 
      queryParams.has(param) || fragmentParams.has(param)
    );
  }

  #mergeParameters(queryParams, fragmentParams) {
    return {
      prompts: [...queryParams.getAll('ext-q'), ...fragmentParams.getAll('ext-q')],
      model: queryParams.get('ext-m') || fragmentParams.get('ext-m'),
      send: queryParams.get('ext-send') || fragmentParams.get('ext-send'),
      clipboard: queryParams.get('ext-clipboard') || fragmentParams.get('ext-clipboard'),
      requiredLogin: queryParams.get('ext-required-login') || fragmentParams.get('ext-required-login')
    };
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

class ExternalMessageHandler {

  init() {
    chrome.runtime.onMessageExternal.addListener(this.handleExternalMessage.bind(this));
  }

  handleExternalMessage(request, sender, sendResponse) {
    if (request.type === 'PING') {
      sendResponse({status: 'ALIVE', version: chrome.runtime.getManifest().version});
    }
    return true;
  }
}

const internalMessageHandler = new InternalMessageHandler();
internalMessageHandler.init();

const externalMessageHandler = new ExternalMessageHandler();
externalMessageHandler.init();