class QueryParameter {
  static CLIPBOARD_KEYWORD = '{{clipboard}}';
  static #PRIVATE_TOKEN = Symbol('QueryParameterToken');

  constructor({ prompt = null, modelQuery = null, isAutoSend = null, isUseClipboard = null, token = null} = {}) {
    if (token !== QueryParameter.#PRIVATE_TOKEN) {
      throw new Error('Invalid constructor call: Use static factory methods instead');
    }
    
    this.prompt = prompt;
    this.modelQuery = modelQuery;
    this.isAutoSend = isAutoSend;
    this.isUseClipboard = isUseClipboard;
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

  static async generate({ prompt = null, modelQuery = null, isAutoSend = null, isUseClipboard = null} = {}) {
    const promptText = await QueryParameter.#processPrompt(prompt, isUseClipboard);

    return new QueryParameter({
      prompt: promptText,
      modelQuery: modelQuery,
      isAutoSend: isAutoSend,
      isUseClipboard: isUseClipboard,
      token: QueryParameter.#PRIVATE_TOKEN
    });
  }

  static async generateFromUrl() {
    const response = await QueryParameter.#fetchParameters();
    const promptText = await QueryParameter.#processPrompt(response.prompt, response.clipboard);
    const modelQuery = QueryParameter.#processModel(response.model);
    const isAutoSend = QueryParameter.#convertToBoolean(response.send);

    return new QueryParameter({
      prompt: promptText,
      modelQuery: modelQuery,
      isAutoSend: isAutoSend,
      isUseClipboard: null,
      token: QueryParameter.#PRIVATE_TOKEN
    });
  }

  getPrompt() {
    return this.prompt;
  }

  getModelQuery() {
    return this.modelQuery;
  }

  IsAutoSend() {
    return this.isAutoSend;
  }
  
  buildUrl(location) {
    const url = new URL(location.origin + location.pathname);
    if (this.modelQuery) {
      url.searchParams.set('ext-m', this.modelQuery.getIdentifierString());
    }
    if (this.prompt) {
      url.searchParams.set('ext-q', this.prompt);
      if (this.isAutoSend) {
        url.searchParams.set('ext-send', '1');
      }
      if (this.prompt.includes(QueryParameter.CLIPBOARD_KEYWORD) && this.isUseClipboard !== false) {
        url.searchParams.set('ext-clipboard', '1');
      }
    }
    return url.toString();
  }

  static async #processPrompt(promptText, clipboard) {
    if (promptText) {
      const keyword = QueryParameter.CLIPBOARD_KEYWORD;
      const isUseClipboard = QueryParameter.#convertToBoolean(clipboard);
      if (isUseClipboard && promptText.includes(keyword)) {
        let clipboardText = '';
        try {
          clipboardText = await navigator.clipboard.readText() || '';
        } catch (err) {
          clipboardText = '';
        }
        promptText = promptText.replace(new RegExp(keyword, 'g'), clipboardText);
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
