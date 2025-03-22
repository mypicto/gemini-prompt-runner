document.addEventListener('DOMContentLoaded', () => {
  new PopupApp().initialize();
});

class PopupApp {
  constructor() {
    this.localizeService = new LocalizeService();

    this.appNameComponent = new AppNameComponent();
    this.appVersionComponent = new AppVersionComponent();
    this.manifestService = new ManifestService(this.appNameComponent, this.appVersionComponent);

    this.externalLinkComponent = new ExternalLinkComponent();
    this.externalLinkService = new ExternalLinkService(this.externalLinkComponent);

    this.manualUrlComponent = new ManualUrlComponent();
    this.manualUrlService = new ManualUrlService(this.manualUrlComponent, this.localizeService);

    this.urlGenerateComponent = new UrlGenerateComponent();
    this.urlGenerateService = new UrlGenerateService(
      this.urlGenerateComponent,
      new ClipboardService(),
      this.localizeService
    );
  }

  initialize() {
    this.localizeService.init();
    this.manifestService.init();
    this.externalLinkService.init();
    this.manualUrlService.init();
    this.urlGenerateService.init();
  }
}

class AppNameComponent {
  constructor() {
    this.element = document.getElementById('appName');
  }
  
  setAppName(name) {
    if (this.element) {
      this.element.textContent = name;
    }
  }
}

class AppVersionComponent {
  constructor() {
    this.element = document.getElementById('appVersion');
  }

  setAppVersion(version) {
    if (this.element) {
      this.element.textContent = version;
    }
  }
}

class ManifestService {
  constructor(appNameComponent, appVersionComponent) {
    this.appNameComponent = appNameComponent;
    this.appVersionComponent = appVersionComponent;
  }

  init() {
    const manifest = chrome.runtime.getManifest();
    document.title = manifest.name;
    this.appNameComponent.setAppName(manifest.name);
    this.appVersionComponent.setAppVersion(`ver${manifest.version}`);
  }
}

class ExternalLinkComponent {
  constructor() {
    this.links = document.querySelectorAll('a[target="_blank"]');
  }

  attachExternalLinkListeners() {
    this.links.forEach(link => {
      link.addEventListener('click', event => {
        event.preventDefault();
        chrome.tabs.create({ url: link.href });
      });
    });
  }
}

class ExternalLinkService {
  constructor(component) {
    this.component = component;
  }

  init() {
    this.component.attachExternalLinkListeners();
  }
}

class ManualUrlComponent {
  constructor() {
    this.element = document.getElementById('manualUrl');
  }

  attachManualClickListener(callback) {
    if (this.element) {
      this.element.addEventListener('click', callback);
    }
  }
}

class ManualUrlService {
  constructor(component, localizeService) {
    this.component = component;
    this.localizeService = localizeService;
  }

  init() {
    this.component.attachManualClickListener(this.handleClick.bind(this));
  }

  handleClick(event) {
    const promptUrl = this.localizeService.getMessage('promptReadmeURL');
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
}

class UrlGenerateComponent {
  constructor() {
    this.includeModel = document.getElementById('includeModel');
    this.includePrompt = document.getElementById('includePrompt');
    this.autoSend = document.getElementById('autoSend');
    this.button = document.getElementById('urlGenerateButton');
  }

  attachButtonClickListener(callback) {
    if (this.button) {
      this.button.addEventListener('click', callback);
    }
  }

  updateButton(text, additionalClass) {
    if (this.button) {
      this.button.textContent = text;
      if (additionalClass) {
        this.button.classList.add(additionalClass);
      }
    }
  }

  getOptions() {
    return {
      includeModel: this.includeModel.checked,
      includePrompt: this.includePrompt.checked,
      autoSend: this.autoSend.checked
    };
  }

  attachIncludePromptChangeListener(callback) {
    if (this.includePrompt) {
      this.includePrompt.addEventListener('change', callback);
    }
  }

  updateAutoSendState() {
    if (!this.includePrompt.checked) {
      this.autoSend.disabled = true;
      this.autoSend.checked = false;
    } else {
      this.autoSend.disabled = false;
    }
  }
  
  disableAll() {
    this.includeModel.disabled = true;
    this.includePrompt.disabled = true;
    this.autoSend.disabled = true;
    this.button.disabled = true;
  }
}

class UrlGenerateService {
  constructor(component, clipboardService, localizeService) {
    this.component = component;
    this.clipboardService = clipboardService;
    this.localizeService = localizeService;
  }

  async init() {
    this.component.attachIncludePromptChangeListener(() => this.component.updateAutoSendState());
    this.component.attachButtonClickListener(this.handleCopyButtonClick.bind(this));
    let url = await this.generateUrl();
    if (url === null) {
      this.component.disableAll();
    }
  }

  async generateUrl() {
    const options = this.component.getOptions();
    const tabs = await new Promise(resolve =>
      chrome.tabs.query({ active: true, currentWindow: true }, resolve)
    );
    if (!tabs || tabs.length === 0) {
      return null;
    }
    const tab = tabs[0];
    const response = await new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tab.id, {
        action: "getGenerateUrl",
        includeModel: options.includeModel,
        includePrompt: options.includePrompt,
        autoSend: options.autoSend
      }, (resp) => {
        if (chrome.runtime.lastError) {
          resolve(null);
        } else {
          resolve(resp);
        }
      });
    });
    if (response && response.url) {
      return response.url;
    }
    return null
  }

  async copyAndInteraction(url) {
    try {
      await this.clipboardService.copy(url);
      this.component.updateButton(this.localizeService.getMessage('popupCopySuccess'), 'copied');
    } catch (err) {
      console.error('Failed to copy URL:', err);
      throw err;
    }
  }

  async handleCopyButtonClick() {
    try {
      const url = await this.generateUrl();
      await this.copyAndInteraction(url);
    } catch (err) {
      console.error(err);
    }
  }
}

class LocalizeService {
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
    this.localizeElements.forEach(element => {
      const text = element.textContent;
      const msgKey = this.#extractMessageKey(text);
      if (msgKey) {
        const localizedText = this.getMessage(msgKey);
        element.textContent = localizedText;
      }
    });
  }

  localizeAttributes() {
    this.localizeAttrElements.forEach(element => {
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

// class MessagingService {
//   getUrlFromActiveTab() {
//     return new Promise((resolve, reject) => {
//       chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//         if (!tabs || tabs.length === 0) {
//           resolve(null);
//           return;
//         }
//         const tab = tabs[0];
//         chrome.tabs.sendMessage(tab.id, { action: 'getGenerateUrl' }, (response) => {
//           if (chrome.runtime.lastError) {
//             resolve(null);
//           } else if (response && response.url) {
//             resolve(response.url);
//           } else {
//             resolve(null);
//           }
//         });
//       });
//     });
//   }
// }

class ClipboardService {
  copy(text) {
    return navigator.clipboard.writeText(text);
  }
}
