class Application {
  constructor() {
    this.selectorManager = new SelectorManager();
    this.textarea = new Textarea(this.selectorManager);
    this.modelSelector = new ModelSelector(this.selectorManager);
    this.submitButton = new SubmitButton(this.selectorManager);
    this.queryParameter = new QueryParameter();
  }

  init() {
    this.queryParameter.fetchParameters();

    this.selectorManager.addCopyShortcutListener();
    document.addEventListener('DOMContentLoaded', async () => {
      await this.selectorManager.init();

      const prompt = await this.queryParameter.getPrompt();
      const modelIndex = await this.queryParameter.getModelIndex();
      const isConfirm = await this.queryParameter.IsConfirm();

      await this.operateGemini(prompt, modelIndex, isConfirm);
    });
  }

  async operateGemini(prompt, modelIndex, isConfirm) {
    const hasPrompt = prompt && prompt.trim() !== "";
    if (hasPrompt) {
      await this.textarea.setPrompt(prompt);
    }
    if (modelIndex !== null) {
      await this.modelSelector.selectModel(modelIndex);
    }
    if (!isConfirm && hasPrompt) {
      await this.submitButton.submit();
    }
  }
}

const app = new Application();
app.init();
