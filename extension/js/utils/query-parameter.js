class Parameter {
  async getPrompt() {
    throw new Error('Not implemented');
  }

  async getModelIndex() {
    throw new Error('Not implemented');
  }

  async getModelName() {
    throw new Error('Not implemented');
  }

  async IsConfirm() {
    throw new Error('Not implemented');
  }
}

class QueryParameter extends Parameter {
  constructor() {
    super();
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
          this.response = new Error(this.error);
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

  async #waitForResponse() {
    while (this.response === null) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (this.response instanceof Error) {
      throw this.response;
    }
    return this.response;
  }

  async getPrompt() {
    const response = await this.#waitForResponse();
    const clipboard = await this.#IsClipboard();
    const keyword = "{{clipboard}}";
    let promptText = response.prompt;
    if (clipboard && promptText && promptText.includes(keyword)) {
      let clipboardText;
      try {
        clipboardText = await navigator.clipboard.readText() || "";
      } catch (err) {
        clipboardText = "";
      }
      promptText = promptText.replace(new RegExp(keyword, "g"), clipboardText);
    }
    if (promptText) {
      promptText = LineEndingConverter.convertToLF(promptText);
    }
    return promptText;
  }

  async getModelIndex() {
    const response = await this.#waitForResponse();
    const model = response.model;
    if (model && this.#isInteger(model)) {
      return parseInt(model, 10);
    }
    return null;
  }

  async getModelName() {
    const response = await this.#waitForResponse();
    const model = response.model;
    if (model && !this.#isInteger(model)) {
      return model;
    }
    return null;
  }

  #isInteger(value) {
    return /^\d+$/.test(value);
  }

  async IsConfirm() {
    const response = await this.#waitForResponse();
    const value = response.confirm;
    if (value === 'true' || value === '1') {
      return true;
    }
    return false;
  }

  async #IsClipboard() {
    const response = await this.#waitForResponse();
    const value = response.clipboard;
    if (value === 'true' || value === '1') {
      return true;
    }
    return false;
  }
}

class LineEndingConverter {
  static convertToLF(text) {
    return text.replace(/\r\n|\r/g, '\n');
  }
}
