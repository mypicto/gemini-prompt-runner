class SelectorManager {
  constructor() {
    this.data = {};
  }

  addCopyShortcutListener() {
    document.addEventListener('keydown', this.handleCopyShortcut.bind(this));
  }

  async handleCopyShortcut(event) {
    if (!((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c')) {
      return;
    }
    if (this.isSelectionEmpty()) {
      try {
        await this.triggerMoreMenu();
        await this.triggerCopy();
      } catch (error) {
        if (!(error.message && error.message.startsWith('Timeout:'))) {
          console.error('Error handling copy shortcut:', error);
        }
      }
    }
  }

  isSelectionEmpty() {
    const selection = window.getSelection();
    return (!selection || selection.toString().trim().length === 0);
  }

  async triggerMoreMenu() {
    const moreMenuButtons = await this.getElements('moreMenuButton', 0);
    if (moreMenuButtons && moreMenuButtons.length > 0) {
      moreMenuButtons[moreMenuButtons.length - 1].click();
    }
  }

  async triggerCopy() {
    const copyButtons = await this.getElements('copyButton', 0);
    if (copyButtons && copyButtons.length > 0) {
      copyButtons[copyButtons.length - 1].click();
    }
  }

  async init() {
    const res = await fetch(chrome.runtime.getURL('res/selectors.json'));
    this.data = await res.json();
  }

  async getElement(id, timeout = 1000, contextNode = document) {
    const entry = this.data[id];
    if (!entry) {
      throw new Error(`Selector entry not found for ID "${id}"`);
    }

    const startTime = Date.now();
    do {
      let baseElement = contextNode;
      if (entry.selector && baseElement) {
        baseElement = baseElement.querySelector(entry.selector);
      }

      if (baseElement) {
        if (entry.xpath) {
          const result = document.evaluate(
            entry.xpath,
            baseElement,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          );
          const subElement = result.singleNodeValue;
          if (subElement) {
            return subElement;
          }
        } else {
          return baseElement;
        }
      }
      await new Promise(r => setTimeout(r, 100));
    } while (Date.now() - startTime < timeout);
    throw new Error(`Timeout: Could not find element for ID "${id}"`);
  }

  async getElements(id, timeout = 1000, contextNode = document) {
    const entry = this.data[id];
    if (!entry || !entry.selector) {
      throw new Error(`Selector with ID "${id}" does not exist or has no "selector".`);
    }

    const startTime = Date.now();
    do {
      const elements = contextNode.querySelectorAll(entry.selector);
      if (elements.length > 0) {
        return elements;
      }
      await new Promise(r => setTimeout(r, 100));
    } while (Date.now() - startTime < timeout);
    throw new Error(`Timeout: Could not find elements for ID "${id}"`);
  }
}

class Textarea {
  constructor(selectorManager) {
    this.selectorManager = selectorManager;
  }

  async #findElement() {
    return await this.selectorManager.getElement('textarea');
  }

  async setPrompt(prompt) {
    const element = await this.#findElement();
    element.textContent = prompt;
    this.moveCursorToEnd(element);
  }

  moveCursorToEnd(element) {
    element.focus();
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

class SubmitButton {
  constructor(selectorManager) {
    this.selectorManager = selectorManager;
  }

  async #findElement() {
    return await this.selectorManager.getElement('submitButton');
  }

  async submit() {
    const element = await this.#findElement();
    if (element) {
      element.click();
    }
  }
}

class ModelSelector {
  constructor(selectorManager) {
    this.selectorManager = selectorManager;
  }

  async #findListElement() {
    return await this.selectorManager.getElement('modelList');
  }

  async #findItemElement(modelIndex) {
    const elements = await this.selectorManager.getElements('modelMenu');
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
      return;
    }
    this.#click(list);
    const item = await this.#findItemElement(modelIndex);
    if (!item) {
      console.warn('Model item not found');
      return;
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
    const newUrl =
      url.origin + url.pathname + (params.toString() ? '?' + params.toString() : '');
    window.history.replaceState({}, '', newUrl);
  }
}

class Application {
  constructor() {
    this.selectorManager = new SelectorManager();
    this.textarea = new Textarea(this.selectorManager);
    this.modelSelector = new ModelSelector(this.selectorManager);
    this.submitButton = new SubmitButton(this.selectorManager);
  }

  init() {
    this.selectorManager.addCopyShortcutListener();
    document.addEventListener('DOMContentLoaded', async () => {
      await this.selectorManager.init();

      const prompt = QueryParameter.getPrompt();
      const modelIndex = QueryParameter.getModelIndex();
      const isConfirm = QueryParameter.IsConfirm();

      await this.operateGemini(prompt, modelIndex, isConfirm);
      setTimeout(() => {
        QueryParameter.removeParameters();
      }, 5000);
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
