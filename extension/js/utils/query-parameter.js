class QueryParameter {
  static CLIPBOARD_KEYWORD = '{{clipboard}}';
  static #PRIVATE_TOKEN = Symbol('QueryParameterToken');

  constructor({ prompts = null, modelQuery = null, isAutoSend = null, isUseClipboard = null, token = null} = {}) {
    if (token !== QueryParameter.#PRIVATE_TOKEN) {
      throw new Error('Invalid constructor call: Use static factory methods instead');
    }
    
    this.prompts = prompts;
    this.modelQuery = modelQuery;
    this._isAutoSend = isAutoSend;
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

  static async generate({ prompts = null, modelQuery = null, isAutoSend = null, isUseClipboard = null} = {}) {
    const promptTexts = prompts
      ? await Promise.all(prompts.map(prompt => QueryParameter.#processPrompt(prompt, isUseClipboard)))
      : [];

    return new QueryParameter({
      prompts: promptTexts,
      modelQuery: modelQuery,
      isAutoSend: isAutoSend,
      isUseClipboard: isUseClipboard,
      token: QueryParameter.#PRIVATE_TOKEN
    });
  }

  static async generateFromUrl() {
    const response = await QueryParameter.#fetchParameters();
    const promptTexts = response.prompts
      ? await Promise.all(response.prompts.map(prompt => QueryParameter.#processPrompt(prompt, response.clipboard)))
      : [];
    const modelQuery = QueryParameter.#processModel(response.model);
    const isAutoSend = QueryParameter.#convertToBoolean(response.send);

    return new QueryParameter({
      prompts: promptTexts,
      modelQuery: modelQuery,
      isAutoSend: isAutoSend,
      isUseClipboard: null,
      token: QueryParameter.#PRIVATE_TOKEN
    });
  }

  getPrompts() {
    return this.prompts;
  }

  getModelQuery() {
    return this.modelQuery;
  }

  isAutoSend() {
    return this._isAutoSend;
  }
  
  buildUrl(location) {
    const url = new URL(location.origin + location.pathname);
    if (this.modelQuery) {
      url.searchParams.set('ext-m', this.modelQuery.getIdentifierString());
    }
    if (this.prompts) {
      for (let prompt of this.prompts) {
        url.searchParams.append('ext-q', prompt);
      }
      if (this._isAutoSend) {
        url.searchParams.set('ext-send', '1');
      }
      const hasClipboardKeyword = this.prompts.some(prompt => prompt.includes(QueryParameter.CLIPBOARD_KEYWORD));
      if (hasClipboardKeyword && this.isUseClipboard !== false) {
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
