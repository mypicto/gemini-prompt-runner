class SelectorManager {
  constructor() {
    this.data = {};
  }

  addCopyShortcutListener() {
    document.addEventListener('keydown', this.handleCopyShortcut.bind(this));
  }

  async handleCopyShortcut(event) {
    const isMac = navigator.userAgent.includes('Macintosh');
    const isShortcut = (isMac ? event.metaKey : event.ctrlKey) && (event.key.toLowerCase() === 'c');
    if (!isShortcut) {
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
  constructor() {
    this.response = null;
  }

  async fetchParameters() {
    if (this.response) {
      return this.response;
    }
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'requestParameters' }, (response) => {
        if (chrome.runtime.lastError) {
          this.response = new Error(this.error);
          return reject(this.response);
        }
        if (!response) {
          this.response = new Error(this.error)
          return reject(this.response);
        }
        if (response.error) {
          this.response = new Error(this.error);
          return reject(this.response);
        }
        this.response = response;
        return resolve(response);
      });
    });
  }

  async getPrompt() {
    while (this.response === null) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (this.response instanceof Error) {
      throw this.response;
    }
    let promptText = this.response.prompt;
    const keyword = "{{clipboard}}";
    if (promptText && promptText.includes(keyword)) {
      let clipboardText;
      try {
        clipboardText = await navigator.clipboard.readText() || "";
      } catch (err) {
        clipboardText = "";
      }
      promptText = promptText.replace(new RegExp(keyword, "g"), clipboardText);
    }
    return promptText;
  }

  async getModelIndex() {
    while (this.response === null) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (this.response instanceof Error) {
      throw this.response;
    }
    const value = this.response.model;
    if (value) {
      return parseInt(value, 10);
    }
    return null;
  }

  async IsConfirm() {
    while (this.response === null) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (this.response instanceof Error) {
      throw this.response;
    }
    const value = this.response.confirm;
    if (value === 'true' || value === '1') {
      return true;
    }
    return false;
  }
}

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
