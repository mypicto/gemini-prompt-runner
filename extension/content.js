class Textarea {
  async #findElement() {
    const TEXTAREA_XPATH = './/div/p';
    const startTime = Date.now();
    while (true) {
      if (Date.now() - startTime > 1000) {
        throw new Error("Timeout: Textarea not found within 5 seconds");
      }
      const richTextareaElement = document.querySelector('rich-textarea');
      if (richTextareaElement) {
        const textarea = document.evaluate(TEXTAREA_XPATH, richTextareaElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (textarea) {
          return textarea;
        }
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  async setPrompt(prompt) {
    const element = await this.#findElement();
    element.textContent = prompt;
  }
}

class SubmitButton {
  #findElement() {
    const inputAreaContentElement = document.querySelector('input-area-content');
    if (inputAreaContentElement) {
      const SEND_BUTTON_XPATH = 'div/div/div[3]/div/div[2]/button';
      return document.evaluate(SEND_BUTTON_XPATH, inputAreaContentElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    }
    return null;
  }

  async #findActiveElement() {
    const startTime = Date.now();
    while (true) {
      if (Date.now() - startTime > 1000) {
        throw new Error("Timeout: Active send button not found within 5 seconds");
      }
      const element = this.#findElement();
      if (element && element.getAttribute('aria-disabled') === 'false') {
        return element;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  #click(buttonElement) {
    const event = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true
    });
    buttonElement.dispatchEvent(event);
  }

  async submit() {
    const element = await this.#findActiveElement();
    if (element) {
      this.#click(element);
    }
  }
}

class ModelSelector {
  async #findListElement() {
    const startTime = Date.now();
    while (Date.now() - startTime < 1000) {
      const element = document.querySelector('button.gds-mode-switch-button');
      if (element) {
        return element;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async #findItemElement(modelIndex) {
    const startTime = Date.now();
    while (Date.now() - startTime < 1000) {
      const elements = document.querySelectorAll('button.bard-mode-list-button');
      if (elements.length > modelIndex) {
        const element = elements[modelIndex];
        if (element && element.getAttribute('aria-disabled') === 'false') {
          return element;
        }
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return null;
  }

  #click(buttonElement) {
    const event = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true
    });
    buttonElement.dispatchEvent(event);
  }

  async selectModel(modelIndex) {
    const list = await this.#findListElement();
    if (!list) {
      return
    }
    this.#click(list);
    const item = await this.#findItemElement(modelIndex);
    if (!item) {
      return
    }
    this.#click(item);
  }
}

class QueryParameter {
  static getPrompt() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('q');
  }

  static getModelIndex() {
    const urlParams = new URLSearchParams(window.location.search);
    const value = urlParams.get('m');
    if (value) {
      return parseInt(value, 10);
    }
    return null;
  }

  static getRunFlag() {
    const urlParams = new URLSearchParams(window.location.search);
    const value = urlParams.get('run');
    if (value === 'true' || value === '1') {
      return true;
    }
    return false;
  }

  static removeParameters() {
    const url = new URL(window.location);
    const params = url.searchParams;
    params.delete('q');
    params.delete('m');
    params.delete('run');
    const newUrl = url.origin + url.pathname + (params.toString() ? '?' + params.toString() : '');
    window.history.replaceState({}, '', newUrl);
  }
}

class Application {
  constructor() {
    this.textarea = new Textarea();
    this.modelSelector = new ModelSelector();
    this.submitButton = new SubmitButton();
  }

  init() {
    document.addEventListener('DOMContentLoaded', async () => {
      const prompt = QueryParameter.getPrompt();
      const modelIndex = QueryParameter.getModelIndex();
      const isRun = QueryParameter.getRunFlag();
      await this.operateGemini(prompt, modelIndex, isRun);
      setTimeout(() => {
        QueryParameter.removeParameters();
      }, 5000);
    });
  }

  /**
   * パラメータに従っtGeminiを操作します。
   * 
   * @param {string} prompt - 挿入するプロンプトの文字列
   * @param {number} modelIndex - 選択するモデルのインデックス
   * @param {boolean} isRun - プロンプト挿入後に送信ボタンをクリックするかどうかのフラグ
   */
  async operateGemini(prompt, modelIndex, isRun) {
    const hasPrompt = prompt && prompt.trim() !== "";
    if (hasPrompt) {
      await this.textarea.setPrompt(prompt);
    }
    if (modelIndex !== null) {
      await this.modelSelector.selectModel(modelIndex);
    }
    if (isRun && hasPrompt) {
      await this.submitButton.submit();
    }
  }
}

const app = new Application();
app.init();
