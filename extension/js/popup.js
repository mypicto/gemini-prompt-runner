document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp() {
  let localizeManager = new LocalizeManager();
  localizeManager.init();
  initManifest();
  initExternalLinks();
  updatePromptUrl(localizeManager);
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

function updatePromptUrl(localizeManager) {
  let promptUrl = localizeManager.getMessage('promptReadmeURL');
  fetch(chrome.runtime.getURL(promptUrl))
    .then(response => response.text())
    .then(text => {
      const link = document.querySelector('.manual-url a');
      if (!link) return;
      const urlObj = new URL(link.href);
      urlObj.searchParams.set('ext-q', text);
      link.href = urlObj.toString();
    })
    .catch(error => {
      console.error('Failed to fetch prompt URL:', error);
    });
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

  // ヘルパーメソッドを追加
  #extractMessageKey(text) {
    const match = text.match(/__MSG_(\w+)__/);
    return match ? match[1] : null;
  }
}