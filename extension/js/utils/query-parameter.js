class QueryParameter {
  constructor({ prompt = null, modelQuery = null, isConfirm = null } = {}) {
    this.prompt = prompt;
    this.modelQuery = modelQuery;
    this.isConfirm = isConfirm;
  }

  static async #fetchParameters() {
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
    const response = await QueryParameter.#fetchParameters();
    const prompt = await QueryParameter.#processPrompt(response.prompt);
    const modelQuery = QueryParameter.#processModel(response.model);
    const isConfirm = QueryParameter.#convertToBoolean(response.confirm);

    return new QueryParameter({
      prompt: prompt,
      modelQuery: modelQuery,
      isConfirm: isConfirm
    });
  }

  getPrompt() {
    return this.prompt;
  }

  getModelQuery() {
    return this.modelQuery;
  }

  IsConfirm() {
    return this.isConfirm;
  }

  static async #processPrompt(promptText) {
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

  static #processModel(model) {
    if (model == null) {
      return null;
    }
    if (QueryParameter.#isInteger(model)) {
      const modelIndex = parseInt(model, 10);
      return new IdentifierModelQuery(modelIndex);
    } else {
      return new NominalModelQuery(model);
    }
  }

  static #isInteger(value) {
    return /^\d+$/.test(value);
  }

  static #convertToBoolean(value) {
    return (value === 'true' || value === '1');
  }
}

class LineEndingConverter {
  static convertToLF(text) {
    return text.replace(/\r\n|\r/g, '\n');
  }
}
