class Application {
  constructor() {
    this.selectorService = new SelectorService();
    this.copyButton = new CopyButton(this.selectorService);
    this.copyService = new CopyService(this.selectorService, this.copyButton);
    this.textarea = new Textarea(this.selectorService);
    this.modelSelector = new ModelSelector(this.selectorService);
    this.sendButton = new SendButton(this.selectorService);
    this.urlGenerateService = new UrlGenerateService(this.textarea, this.modelSelector);
    this.clipboardKeywordService = new ClipboardKeywordService(this.textarea);
  }

  init() {
    this.copyService.addCopyShortcutListener();
    this.urlGenerateService.subscribeToListeners();
    this.clipboardKeywordService.subscribeToListeners();

    document.addEventListener('DOMContentLoaded', async () => {
      await this.selectorService.init();
      await UIStabilityMonitor.waitForUiStability();
      await this.#operateGemini();
    });
  }

  async #operateGemini() {
    const parameter = await QueryParameter.generateFromUrl();
    const prompt = parameter.getPrompt();
    const modelQuery = parameter.getModelQuery();
    const isAutoSend = parameter.IsAutoSend();
    const isOnGemPage = LocationChecker.isOnGemPage();

    if (modelQuery !== null && !isOnGemPage) {
      const currentModelQuery = await this.modelSelector.getCurrentModelQuery();
      if (!currentModelQuery.equalsQuery(modelQuery)) {
        await this.modelSelector.selectModel(modelQuery);
        await UIStabilityMonitor.waitForUiStability();
      }
    }
    const hasPrompt = prompt && prompt.trim() !== '';
    if (hasPrompt) {
      await this.textarea.setPrompt(prompt);
    }
    if (isAutoSend && hasPrompt) {
      await this.sendButton.submit();
    }
  }
}

const app = new Application();
app.init();
