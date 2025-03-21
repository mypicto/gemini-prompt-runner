class Application {
  constructor() {
    this.selectorService = new SelectorService();
    this.copyButton = new CopyButton(this.selectorService);
    this.copyService = new CopyService(this.selectorService, this.copyButton);
    this.textarea = new Textarea(this.selectorService);
    this.modelSelector = new ModelSelector(this.selectorService);
    this.submitButton = new SubmitButton(this.selectorService);
    this.urlGenerateService = new UrlGenerateService(this.textarea, this.modelSelector);
  }

  init() {
    this.copyService.addCopyShortcutListener();
    this.urlGenerateService.subscribeToListeners();

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
    const isConfirm = parameter.IsConfirm();
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
    if (!isConfirm && hasPrompt) {
      await this.submitButton.submit();
    }
  }
}

const app = new Application();
app.init();
