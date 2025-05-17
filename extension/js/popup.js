import { QueryParameter } from './utils/query-parameter.js';
import { IdentifierModelQuery } from './models/model-query.js';
import { ClipboardService } from './services/clipboard-service.js';

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
    
    this.queryWarningComponent = new QueryWarningComponent();
    this.queryWarningService = new QueryWarningService(this.queryWarningComponent);
  }

  initialize() {
    this.localizeService.init();
    this.manifestService.init();
    this.externalLinkService.init();
    this.manualUrlService.init();
    this.urlGenerateService.init();
    this.queryWarningService.init();
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
      .then(async text => {
        const locationMock = { origin: 'https://gemini.google.com', pathname: '/app' };
        const queryParameter = QueryParameter.generate({
          prompts: text ? [text] : null,
          modelQuery: new IdentifierModelQuery(0),
          isAutoSend: true,
          isUseClipboard: false
        });
        chrome.tabs.create({ url: queryParameter.buildUrl(locationMock) });
      })
      .catch(error => {
        console.error('Failed to fetch prompt URL:', error);
      });
  }
}

class UrlGenerateRepository {
  constructor() {
    this.storageKey = 'urlGenerateOptions';
    this.defaultOptions = {
      includeModel: true,
      includePrompt: true,
      autoSend: false,
      requiredLogin: false,
      redirectUrl: false
    };
  }

  async saveOptions(options) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [this.storageKey]: options }, resolve);
    });
  }

  async getOptions() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.storageKey], (result) => {
        const savedOptions = result[this.storageKey] || {};
        resolve({ ...this.defaultOptions, ...savedOptions });
      });
    });
  }
}

class UrlGenerateComponent {
  constructor() {
    this.includeModel = document.getElementById('includeModel');
    this.includePrompt = document.getElementById('includePrompt');
    this.autoSend = document.getElementById('autoSend');
    this.requiredLogin = document.getElementById('requiredLogin');
    this.redirectUrl = document.getElementById('redirectUrl');
    this.urlGenerateButton = document.getElementById('urlGenerateButton');
    this.clipboardInsertButton = document.getElementById('clipboardInsertButton');
    this.helpIcons = document.querySelectorAll('.help-icon');
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
      autoSend: this.autoSend.checked,
      requiredLogin: this.requiredLogin.checked,
      redirectUrl: this.redirectUrl.checked
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
    this.requiredLogin.disabled = true;
    this.redirectUrl.disabled = true;
    this.clipboardInsertButton.disabled = true;
    
    this.helpIcons.forEach(icon => {
      icon.classList.add('disabled');
    });
  }

  setOptions(options) {
    if (this.includeModel) this.includeModel.checked = options.includeModel;
    if (this.includePrompt) this.includePrompt.checked = options.includePrompt;
    if (this.autoSend) this.autoSend.checked = options.autoSend;
    if (this.requiredLogin) this.requiredLogin.checked = options.requiredLogin;
    if (this.redirectUrl) this.redirectUrl.checked = options.redirectUrl;
    
    this.updateAutoSendState();
  }

  attachOptionsChangeListener(callback) {
    const checkboxes = [this.includeModel, this.includePrompt, this.autoSend, 
                        this.requiredLogin, this.redirectUrl];
    
    checkboxes.forEach(checkbox => {
      if (checkbox) {
        checkbox.addEventListener('change', callback);
      }
    });
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
    this.repository = new UrlGenerateRepository();
  }

  async init() {
    const savedOptions = await this.repository.getOptions();
    this.component.setOptions(savedOptions);

    this.component.attachOptionsChangeListener(() => {
      this.repository.saveOptions(this.component.getOptions());
    });
    
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
        autoSend: options.autoSend,
        requiredLogin: options.requiredLogin
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
    return null;
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
      let url = await this.generateUrl();
      if (url) {
        const options = this.component.getOptions();
        if (options.redirectUrl) {
          url = this.convertToRedirectUrl(url);
        }
        await this.copyAndInteraction(url);
      }
    } catch (err) {
      console.error(err);
    }
  }

  convertToRedirectUrl(originalUrl) {
    try {
      const url = new URL(originalUrl);
      const redirectBaseUrl = 'https://mypicto.github.io/gemini-prompt-runner';
      return `${redirectBaseUrl}${url.pathname}${url.hash}`;
    } catch (err) {
      console.error('Failed to convert URL:', err);
      return originalUrl;
    }
  }

  handleClipboardInsertButtonClick() {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs && tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {action:"insertClipboardKeyword"});
      }
    });
  }
}

class QueryWarningComponent {
  constructor() {
    this.container = document.getElementById('queryWarningContainer');
  }
  
  showWarning() {
    if (this.container) {
      this.container.classList.remove('hidden');
    }
  }
  
  hideWarning() {
    if (this.container) {
      this.container.classList.add('hidden');
    }
  }
}

class QueryWarningService {
  constructor(component) {
    this.component = component;
  }
  
  init() {
    this.checkQueryParameterDetection();
  }
  
  async checkQueryParameterDetection() {
    try {
      const tabs = await new Promise(resolve => 
        chrome.tabs.query({ active: true, currentWindow: true }, resolve)
      );
      
      if (!tabs || tabs.length === 0) return;
      
      const tab = tabs[0];
      
      if (!tab.url || !tab.url.includes('gemini.google.com')) return;
      
      chrome.tabs.sendMessage(
        tab.id, 
        { action: "checkQueryParameterDetection" }, 
        (response) => {
          if (chrome.runtime.lastError) {
            console.error("Error checking query parameter detection:", chrome.runtime.lastError);
            return;
          }
          
          if (response && response.isQueryParameterDetected) {
            this.component.showWarning();
          } else {
            this.component.hideWarning();
          }
        }
      );
    } catch (error) {
      console.error("Error in checkQueryParameterDetection:", error);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new PopupApp();
  app.initialize();
});
