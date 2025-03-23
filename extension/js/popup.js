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
    this.urlGenerateButton = document.getElementById('urlGenerateButton');
    this.clipboardInsertButton = document.getElementById('clipboardInsertButton');
  }

  attachButtonClickListener(callback) {
    if (this.urlGenerateButton) {
      this.urlGenerateButton.addEventListener('click', callback);
    }
  }

  updateUrlGenerateButton(text, additionalClass) {
    if (this.urlGenerateButton) {
      this.urlGenerateButton.textContent = text;
      if (additionalClass) {
        this.urlGenerateButton.classList.add(additionalClass);
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
  
  disableUrlGenerateButton() {
    this.urlGenerateButton.disabled = true;
  }

  disableOptions() {
    this.includeModel.disabled = true;
    this.includePrompt.disabled = true;
    this.autoSend.disabled = true;
    this.clipboardInsertButton.disabled = true;
  }

  attachClipboardInsertButtonClickListener(callback) {
    if (this.clipboardInsertButton) {
      this.clipboardInsertButton.addEventListener('click', callback);
    }
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
    this.component.attachClipboardInsertButtonClickListener(this.handleClipboardInsertButtonClick.bind(this));
    let url = await this.generateUrl();
    if (url === null) {
      this.component.disableOptions();
      this.component.disableUrlGenerateButton();
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
      this.component.updateUrlGenerateButton(this.localizeService.getMessage('popupCopySuccess'), 'copied');
      this.component.disableOptions();
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

  handleClipboardInsertButtonClick() {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs && tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {action:"insertClipboardkKeyword"});
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new PopupApp();
  app.initialize();
});
