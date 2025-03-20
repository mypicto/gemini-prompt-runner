class Application {
  constructor() {
    this.selectorManager = new SelectorManager();
    this.copyButton = new CopyButton(this.selectorManager);
    this.copyService = new CopyService(this.selectorManager, this.copyButton);
    this.textarea = new Textarea(this.selectorManager);
    this.modelSelector = new ModelSelector(this.selectorManager);
    this.submitButton = new SubmitButton(this.selectorManager);
  }

  init() {
    this.copyService.addCopyShortcutListener();
    document.addEventListener('DOMContentLoaded', async () => {
      await this.selectorManager.init();
      await this.operateGemini();
    });
  }

  async operateGemini() {
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

const app = new Application();
app.init();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.action === "getGenerateUrl") {
    sendResponse({ url: window.location.href });
  }
});
