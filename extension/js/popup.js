document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp() {
  let localizeManager = new LocalizeManager();
  localizeManager.init();
  initManifest();
  initExternalLinks();
  initManualUrlClick(localizeManager);
  initUrlGenerateButton(localizeManager);
  updateAutoSend();
}

function initManifest() {
  const manifest = chrome.runtime.getManifest();
  document.title = manifest.name;
  document.getElementById('appName').textContent = manifest.name;
  document.getElementById('appVersion').textContent = `ver${manifest.version}`;
}

function initExternalLinks() {
  const externalLinks = document.querySelectorAll('a[target="_blank"]');
  externalLinks.forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      chrome.tabs.create({ url: link.href });
    });
  });
}

function initManualUrlClick(localizeManager) {
  const manualUrlElement = document.getElementById('manualUrl');
  if (manualUrlElement) {
    manualUrlElement.addEventListener('click', (event) => handleManualUrlClick(event, localizeManager));
  }
}

function handleManualUrlClick(event, localizeManager) {
  let promptUrl = localizeManager.getMessage('promptReadmeURL');
  fetch(chrome.runtime.getURL(promptUrl))
    .then(response => response.text())
    .then(text => {
      const locationMock = { origin: 'https://gemini.google.com', pathname: '/app' };
      const queryParameter = new QueryParameter({
        prompt: text,
        modelQuery: new IdentifierModelQuery(0),
        isAutoSend: true
      });
      chrome.tabs.create({ url: queryParameter.buildUrl(locationMock) });
    })
    .catch(error => {
      console.error('Failed to fetch prompt URL:', error);
    });
}

function initUrlGenerateButton(localizeManager) {
  const messagingService = new MessagingService();
  const clipboardService = new ClipboardService();
  const controller = new UrlGenerateController(messagingService, clipboardService, localizeManager);
  controller.init();
}

function updateAutoSend() {
  var includePrompt = document.getElementById('includePrompt');
  var autoSend = document.getElementById('autoSend');
  function updateAutoSend() {
      if (!includePrompt.checked) {
          autoSend.disabled = true;
          autoSend.checked = false;
      } else {
          autoSend.disabled = false;
      }
  }
  includePrompt.addEventListener('change', updateAutoSend);
  updateAutoSend();
}

class MessagingService {
  getUrlFromActiveTab() {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || tabs.length === 0) {
          resolve(null);
          return;
        }
        const tab = tabs[0];
        chrome.tabs.sendMessage(tab.id, { action: 'getGenerateUrl' }, (response) => {
          if (chrome.runtime.lastError) {
            resolve(null);
          } else if (response && response.url) {
            resolve(response.url);
          } else {
            resolve(null);
          }
        });
      });
    });
  }
}

class ClipboardService {
  copy(text) {
    return navigator.clipboard.writeText(text);
  }
}

class UrlGenerateController {
  constructor(messagingService, clipboardService, localizeManager) {
    this.messagingService = messagingService;
    this.clipboardService = clipboardService;
    this.localizeManager = localizeManager;
  }

  init() {
    const btn = document.getElementById('urlGenerateButton');
    btn.disabled = false;
    btn.addEventListener('click', () => {
      const includeModel = document.getElementById('includeModel').checked;
      const includePrompt = document.getElementById('includePrompt').checked;
      const autoSend = document.getElementById('autoSend').checked;
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || tabs.length === 0) {
          return;
        }
        const tab = tabs[0];
        chrome.tabs.sendMessage(tab.id, {
          action: "getGenerateUrl",
          includeModel: includeModel,
          includePrompt: includePrompt,
          autoSend: autoSend
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Error sending message:', chrome.runtime.lastError.message);
            return;
          }
          if (response && response.url) {
            this.clipboardService.copy(response.url)
              .then(() => {
                btn.textContent = this.localizeManager.getMessage('popupCopySuccess');
                btn.classList.add('copied');
              })
              .catch(err => {
                console.error('Failed to copy URL: ', err);
              });
          }
        });
      });
    });
  }
}

class LocalizeManager {
  
  constructor() {
    this.localizeElements = document.querySelectorAll('[localize]');
    this.localizeAttrElements = document.querySelectorAll('[localize-attr]');
  }

  init() {
    this.localizeContent();
    this.localizeAttributes();
  }

  getMessage(key) {
    return chrome.i18n.getMessage(key);
  }

  localizeContent() {
    this.localizeElements.forEach((element) => {
      const text = element.textContent;
      const msgKey = this.#extractMessageKey(text);
      const localizedText = this.getMessage(msgKey);
      element.textContent = localizedText;
    });
  }
  
  localizeAttributes() {
    this.localizeAttrElements.forEach((element) => {
      const attrMappings = element.getAttribute('localize-attr').split(',');
      
      attrMappings.forEach(mapping => {
        const [attrName, msgKey] = mapping.trim().split(':');
        if (attrName && msgKey) {
          const key = this.#extractMessageKey(msgKey);
          const localizedString = this.getMessage(key);
          element.setAttribute(attrName, localizedString);
        }
      });
    });
  }

  #extractMessageKey(text) {
    const match = text.match(/__MSG_(\w+)__/);
    return match ? match[1] : null;
  }
}
