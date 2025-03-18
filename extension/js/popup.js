document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp() {
  let localizeManager = new LocalizeManager();
  localizeManager.init();
  initManifest();
  initExternalLinks();
  initManualUrlClick(localizeManager);
  initUrlGenerateButton();
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
    console.log(link);
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
      const urlObj = new URL('https://gemini.google.com/app');
      urlObj.searchParams.set('ext-q', text);
      chrome.tabs.create({ url: urlObj.toString() });
    })
    .catch(error => {
      console.error('Failed to fetch prompt URL:', error);
    });
}

function initUrlGenerateButton() {
  const controller = new UrlGenerateController(new MessagingService(), new ClipboardService());
  controller.init();
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
        chrome.tabs.sendMessage(tab.id, { action: "getGenerateUrl" }, (response) => {
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
  constructor(messagingService, clipboardService) {
    this.messagingService = messagingService;
    this.clipboardService = clipboardService;
  }

  init() {
    const btn = document.getElementById('urlGenerateButton');
    btn.disabled = true;
    this.messagingService.getUrlFromActiveTab().then((url) => {
      if (url) {
        btn.disabled = false;
        btn.addEventListener('click', () => {
          this.clipboardService.copy(url)
            .then(() => {
              const copyStatus = document.getElementById('copyStatus');
              if (copyStatus) {
                copyStatus.style.display = 'block';
                setTimeout(() => {
                  copyStatus.style.display = 'none';
                }, 3000);
              }
            })
            .catch(err => {
              console.error("Failed to copy URL: ", err);
            });
        });
      }
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
