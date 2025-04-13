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
    this.iconStateService = new IconStateService();
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

  async #waitForAnsweringToComplete() {
    const timeout = 60000;
    const interval = 500;
    const startTime = Date.now();

    await new Promise(resolve => setTimeout(resolve, 1000)); // ステータスがボタンの表示に反映されるのを待つ 
    while (await this.sendButton.isAnswering()) {
      if (Date.now() - startTime > timeout) {
        throw new Error('Timeout waiting for answering to complete.');
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }

  async #operateGemini() {
    const parameter = await QueryParameter.generateFromUrl();
    const prompts = parameter.getPrompts();
    const modelQuery = parameter.getModelQuery();
    const isAutoSend = parameter.isAutoSend();
    const isOnGemPage = LocationChecker.isOnGemPage();

    try {
      this.progressCounter = await this.#buildProgressCounter(prompts);
      this.iconStateService.updateProgressIcon(this.progressCounter.getProgress());
      await this.#processAll(prompts, modelQuery, isAutoSend, isOnGemPage);
    } finally {
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.iconStateService.resetToDefault();
    }
  }

  async #buildProgressCounter(prompts) {
    let maxValue = 1; // 1 for model
    if (prompts) {
      maxValue += prompts.length * 2; // 1 for prompt and 1 for answer
    }
    const progressCounter = new ProgressCounter(maxValue);
    return progressCounter;
  }

  async #processAll(prompts, modelQuery, isAutoSend, isOnGemPage) {
    if (modelQuery !== null && !isOnGemPage) {
      await this.#processModel(modelQuery);
    }
    this.#incrementProgress()

    if (prompts) {
      await this.#processPrompts(prompts, isAutoSend);
    }
  }

  async #processModel(modelQuery) {
    const currentModelQuery = await this.modelSelector.getCurrentModelQuery();
    if (!currentModelQuery.equalsQuery(modelQuery)) {
      await this.modelSelector.selectModel(modelQuery);
      await UIStabilityMonitor.waitForUiStability();
    }
  }

  async #processPrompts(prompts, isAutoSend) {
    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];
      await this.#processPrompt(prompt, isAutoSend);
      if (!isAutoSend) {
        break;
      }
    }
  }

  async #processPrompt(prompt, isAutoSend) {
    const hasPrompt = prompt && prompt.trim() !== '';
    if (!hasPrompt) {
      return;
    }

    await this.textarea.setPrompt(prompt);

    if (isAutoSend) {
      await UIStabilityMonitor.waitForUiStability();
      this.#incrementProgress()

      await this.sendButton.submit();
      await this.#waitForAnsweringToComplete();
      this.#incrementProgress()
    }
  }

  #incrementProgress() {
    this.progressCounter.incrementCount();
    this.iconStateService.updateProgressIcon(this.progressCounter.getProgress());
  }
}

class ProgressCounter {
  constructor(maxValue) {
    this.maxValue = maxValue;
    this.count = 0;
  }

  incrementCount() {
    this.count ++;
    if (this.count > this.maxValue) {
      this.count = this.maxValue;
    }
  }

  getProgress() {
    if (this.maxValue === 0) {
      return 0;
    }
    return this.count / this.maxValue * 100;
  }
}

const app = new Application();
app.init();
