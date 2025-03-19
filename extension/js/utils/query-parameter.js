const PRIVATE_TOKEN = Symbol('private_constructor_token');

class Parameter {
  getPrompt() {
    throw new Error('Not implemented');
  }

  getModelIndex() {
    throw new Error('Not implemented');
  }

  getModelName() {
    throw new Error('Not implemented');
  }

  IsConfirm() {
    throw new Error('Not implemented');
  }
}

class QueryParameter extends Parameter {
  constructor(token) {
    super();
    if (token !== PRIVATE_TOKEN) {
      throw new Error('Use QueryParameter.generate to create an instance.');
    }
    this.prompt = null;
    this.modelIndex = null;
    this.modelName = null;
    this.isConfirm = null;
  }

  async fetchParameters() {
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'requestParameters' }, (response) => {
        if (chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message));
        }
        if (!response) {
          return reject(new Error('No response'));
        }
        if (response.error) {
          return reject(new Error(response.error));
        }
        resolve(response);
      });
    });
    return response;
  }

  static async generateFromUrl() {
    const instance = new QueryParameter(PRIVATE_TOKEN);
    const response = await instance.fetchParameters();

    instance.prompt = await instance.#processPrompt(response.prompt);
    const modelResult = instance.#processModel(response.model);
    instance.modelIndex = modelResult.modelIndex;
    instance.modelName = modelResult.modelName;
    instance.isConfirm = QueryParameter.convertToBoolean(response.confirm);

    return instance;
  }

  getPrompt() {
    return this.prompt;
  }

  getModelIndex() {
    return this.modelIndex;
  }

  getModelName() {
    return this.modelName;
  }

  IsConfirm() {
    return this.isConfirm;
  }

  async #processPrompt(promptText) {
    if (promptText) {
      const keyword = "{{clipboard}}";
      if (promptText.includes(keyword)) {
        let clipboardText = "";
        try {
          clipboardText = await navigator.clipboard.readText() || "";
        } catch (err) {
          clipboardText = "";
        }
        promptText = promptText.replace(new RegExp(keyword, "g"), clipboardText);
      }
      return LineEndingConverter.convertToLF(promptText);
    }
    return promptText;
  }

  #processModel(model) {
    if (model && this.#isInteger(model)) {
      return { modelIndex: parseInt(model, 10), modelName: null };
    } else {
      return { modelIndex: null, modelName: model || null };
    }
  }

  #isInteger(value) {
    return /^\d+$/.test(value);
  }

  static convertToBoolean(value) {
    return (value === 'true' || value === '1');
  }
}

class LineEndingConverter {
  static convertToLF(text) {
    return text.replace(/\r\n|\r/g, '\n');
  }
}
