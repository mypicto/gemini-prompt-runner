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
  }

  init() {
    this.localizeContent();
  }

  getMessage(key) {
    return chrome.i18n.getMessage(key);
  }

  localizeContent() {
    this.localizeElements.forEach((element) => {
      let regex = /__MSG_(\w+)__/;
      let match;
      let localizedText = element.textContent;
  
      while ((match = regex.exec(localizedText)) !== null) {
        let msgKey = match[1];
        let localizedString = chrome.i18n.getMessage(msgKey);
  
        localizedText = localizedText.replace(match[0], localizedString);
      }

      element.textContent = localizedText;
    });
  }
}