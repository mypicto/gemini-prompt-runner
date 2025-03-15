class Application {
  constructor() {
    this.selectorManager = new SelectorManager();
    this.copyButton = new CopyButton(this.selectorManager);
    this.copyService = new CopyService(this.selectorManager, this.copyButton);
    this.textarea = new Textarea(this.selectorManager);
    this.modelSelector = new ModelSelector(this.selectorManager);
    this.submitButton = new SubmitButton(this.selectorManager);
    this.parameter = new QueryParameter();
  }

  init() {
    this.parameter.fetchParameters();

    this.copyService.addCopyShortcutListener();
    document.addEventListener('DOMContentLoaded', async () => {
      await this.selectorManager.init();
      await this.operateGemini();
    });
  }

  async operateGemini() {
    const prompt = await this.parameter.getPrompt();
    const model = await this.parameter.getModelIndex()
                    ?? await this.parameter.getModelName();
    const isConfirm = await this.parameter.IsConfirm();

    const hasPrompt = prompt && prompt.trim() !== "";
    if (hasPrompt) {
      await this.textarea.setPrompt(prompt);
    }
    if (model !== null) {
      await this.modelSelector.selectModel(model);
    }
    if (!isConfirm && hasPrompt) {
      await this.submitButton.submit();
    }
  }
}

const app = new Application();
app.init();
