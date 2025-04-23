class Application {
  constructor() {
    this.selectorService = new SelectorService();
    this.copyButton = new CopyButton(this.selectorService);
    this.copyService = new CopyService(this.selectorService, this.copyButton);
    this.textarea = new Textarea(this.selectorService);
    this.modelSelector = new ModelSelector(this.selectorService);
    this.sendButton = new SendButton(this.selectorService);
    this.loginButton = new LoginButton(this.selectorService);
    this.urlGenerateService = new UrlGenerateService(this.textarea, this.modelSelector);
    this.clipboardKeywordService = new ClipboardKeywordService(this.textarea);
    this.iconStateService = new IconStateService();
    this.isQueryParameterDetected = false;
  }

  init() {
    this.#extractAndProtectSensitiveFragmentParams();

    this.copyService.addCopyShortcutListener();
    this.urlGenerateService.subscribeToListeners();
    this.clipboardKeywordService.subscribeToListeners();
    
    this.#setupMessageListeners();

    document.addEventListener('DOMContentLoaded', async () => {
      await this.selectorService.init();
      await UIStabilityMonitor.waitForUiStability();
      await this.#operateGemini();
    });
  }

  #setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "checkQueryParameterDetection") {
        sendResponse({ isQueryParameterDetected: this.isQueryParameterDetected });
        return true;
      }
    });
  }

  #extractAndProtectSensitiveFragmentParams() {
    const fragmentParams = this.#getFragmentParams();
    if (QueryParameter.hasTargetParameters(fragmentParams)) {
      this.fragmentParams = fragmentParams;
      this.#removeUrlFragment();
    }
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
    const parameter = await this.#getQueryParameter();
    const prompts = parameter.getPrompts();
    const modelQuery = parameter.getModelQuery();
    const isAutoSend = parameter.isAutoSend();
    const isOnGemPage = LocationChecker.isOnGemPage();
    const isRequiredLogin = parameter.isRequiredLogin();
    
    this.isQueryParameterDetected = parameter.isQueryParameterDetected();
    
    if (this.isQueryParameterDetected) {
      this.iconStateService.setWarningIcon();
    }

    const options = {
      prompts,
      modelQuery,
      autoSend: isAutoSend,
      onGemPage: isOnGemPage,
      requiredLogin: isRequiredLogin
    };

    try {
      this.progressCounter = await this.#buildProgressCounter(prompts);
      
      if (!this.isQueryParameterDetected) {
        this.iconStateService.updateProgressIcon(this.progressCounter.getProgress());
      }
      
      await this.#processAll(options);
    } finally {
      if (!this.isQueryParameterDetected) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.iconStateService.resetToDefault();
      }
    }
  }

  async #getQueryParameter() {
    if (this.fragmentParams) {
      return await QueryParameter.generateFromFragment(this.fragmentParams);
    }
    return await QueryParameter.generateFromBackground();
  }

  #getFragmentParams() {
    const url = new URL(window.location.href);
    const hash = url.hash;
    if (hash && hash.length > 1) {
      const decodedHash = decodeURIComponent(hash.substring(1));
      return new URLSearchParams(decodedHash);
    }
    return new URLSearchParams();
  }

  #removeUrlFragment() {
    history.replaceState(null, document.title, location.origin + location.pathname + location.search);
  }

  async #buildProgressCounter(prompts) {
    let maxValue = 1; // 1 for model
    if (prompts) {
      maxValue += prompts.length * 2; // 1 for prompt and 1 for answer
    }
    const progressCounter = new ProgressCounter(maxValue);
    return progressCounter;
  }

  async #processAll({ prompts, modelQuery, autoSend, onGemPage, requiredLogin }) {
    if (requiredLogin && await this.validateLoginRequirement()) {
      return;
    }

    if (modelQuery !== null && !onGemPage) {
      await this.#processModel(modelQuery);
    }
    this.#incrementProgress()

    if (prompts) {
      await this.#processPrompts(prompts, autoSend);
    }
  }

  async validateLoginRequirement() {
    if (await this.loginButton.exists()) {
      await this.loginButton.click();
      return true;
    }
    return false;
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
    if (!this.isQueryParameterDetected) {
      this.iconStateService.updateProgressIcon(this.progressCounter.getProgress());
    }
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