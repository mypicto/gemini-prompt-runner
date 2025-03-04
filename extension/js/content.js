class ElementFinder {
  static async findElement(selector, timeout = 1000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const element = document.querySelector(selector);
      if (element) {
        return element;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error(`Timeout: Element with selector "${selector}" not found within ${timeout} ms`);
  }

  static async findElements(selector, timeout = 1000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        return elements;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error(`Timeout: Elements with selector "${selector}" not found within ${timeout} ms`);
  }

  static async findElementByXPath(xpath, contextNode = document, timeout = 1000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const result = document.evaluate(xpath, contextNode, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      const element = result.singleNodeValue;
      if (element) {
        return element;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error(`Timeout: Element with XPath "${xpath}" not found within ${timeout} ms`);
  }
}

class Textarea {
  async #findElement() {
    const TEXTAREA_XPATH = './/div/p';
    const richTextareaElement = await ElementFinder.findElement('rich-textarea.text-input-field_textarea');
    return await ElementFinder.findElementByXPath(TEXTAREA_XPATH, richTextareaElement);
  }

  async setPrompt(prompt) {
    const element = await this.#findElement();
    element.textContent = prompt;
    this.moveCursorToEnd(element);
  }

  moveCursorToEnd(element) {
    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

class SubmitButton {
  async #findElement() {
    return await ElementFinder.findElement('button.send-button');
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
    const element = await this.#findElement();
    if (element) {
      this.#click(element);
    }
  }
}

class ModelSelector {
  async #findListElement() {
    return await ElementFinder.findElement('button.bard-mode-menu-button');
  }

  async #findItemElement(modelIndex) {
    const elements = await ElementFinder.findElements('button.bard-mode-list-button');
    if (elements.length > modelIndex) {
      return elements[modelIndex];
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
      console.warn('Model list not found');
      return
    }
    this.#click(list);
    const item = await this.#findItemElement(modelIndex);
    if (!item) {
      console.warn('Model item not found');
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

  static IsConfirm() {
    const urlParams = new URLSearchParams(window.location.search);
    const value = urlParams.get('confirm');
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
    params.delete('confirm');
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
      const isConfirm = QueryParameter.IsConfirm();
      await this.operateGemini(prompt, modelIndex, isConfirm);
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
   * @param {boolean} isConfirm - プロンプトを送信する前に確認するかどうか（自動送信OFF）
   */
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
