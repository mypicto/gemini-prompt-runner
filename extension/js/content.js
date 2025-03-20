class Application {
  constructor() {
    this.selectorManager = new SelectorManager();
    this.copyButton = new CopyButton(this.selectorManager);
    this.copyService = new CopyService(this.selectorManager, this.copyButton);
    this.textarea = new Textarea(this.selectorManager);
    this.modelSelector = new ModelSelector(this.selectorManager);
    this.submitButton = new SubmitButton(this.selectorManager);
    this.urlGenerateService = new UrlGenerateService(this.textarea, this.modelSelector);
  }

  init() {
    this.copyService.addCopyShortcutListener();
    this.urlGenerateService.subscribeToListeners();

    document.addEventListener('DOMContentLoaded', async () => {
      await this.selectorManager.init();
      await this.#waitForUiStability();
      await this.#operateGemini();
    });
  }

  async #waitForUiStability() {
    return new Promise(resolve => {
      let isStable = false;
      const observer = new MutationObserver((mutations) => {
        isStable = false;
      });
      observer.observe(document.body, { attributes: true, childList: true, subtree: true });
      const checkInterval = setInterval(() => {
        if (isStable) {
          clearInterval(checkInterval);
          observer.disconnect();
          resolve();
        }
        isStable = true;
      }, 100);
    });
  }

  async #operateGemini() {
    const parameter = await QueryParameter.generateFromUrl();
    const prompt = parameter.getPrompt();
    const modelQuery = parameter.getModelQuery();
    const isConfirm = parameter.IsConfirm();

    const hasPrompt = prompt && prompt.trim() !== "";
    if (hasPrompt) {
      await this.textarea.setPrompt(prompt);
    }
    if (modelQuery !== null) {
      await this.modelSelector.selectModel(modelQuery);
    }
    if (!isConfirm && hasPrompt) {
      await this.submitButton.submit();
    }
  }
}

class UrlGenerateService {
  constructor(textarea, modelSelector) {
    this.textarea = textarea;
    this.modelSelector = modelSelector;
  }

  subscribeToListeners() {
    chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
      if (message && message.action === "getGenerateUrl") {
        const prompt = await this.textarea.getPrompt();
        const modelQuery = await this.modelSelector.getCurrentModelQuery();
        const queryParameter = new QueryParameter({
          prompt: prompt,
          modelQuery: modelQuery,
          isConfirm: !!prompt
        });
        const urlString = queryParameter.buildUrl(window.location);
        sendResponse({ url: urlString });
      }
    });
  }
}

const app = new Application();
app.init();
