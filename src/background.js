import { QueryParameter } from './utils/query-parameter.js';

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
    this.pendingParameters = QueryParameter.generate();
    this.tabIconCache = new TabIconCache();
  }
  
  init() {
    this.#registerWebRequestListener();
    this.#registerMessageListener();
    this.#registerUpdateIconListener();
    this.#registerTabActivationListener();
    this.#registerTabRemovedListener();
  }
  
  #getUrlFilters() {
    const filters = [];
    filters.push(`*://gemini.google.com/*`);
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
    if (QueryParameter.hasTargetParametersInUrl(url)) {
      this.pendingParameters = QueryParameter.generateFromUrl(details.url);
    }
  }
  
  #handleMessage(message, sender, sendResponse) {
    if (message.type === 'requestParameters') {
      sendResponse(this.pendingParameters);
      this.pendingParameters = QueryParameter.generate();
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