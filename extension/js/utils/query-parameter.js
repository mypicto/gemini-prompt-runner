class QueryParameter {
  static CLIPBOARD_KEYWORD = '{{clipboard}}';
  static #PRIVATE_TOKEN = Symbol('QueryParameterToken');
  #isQueryParameterDetected = false;

  constructor({ prompts = null, modelQuery = null, isAutoSend = null, isUseClipboard = null, isRequiredLogin = null, isQueryParameterDetected = false, token = null} = {}) {
    if (token !== QueryParameter.#PRIVATE_TOKEN) {
      throw new Error('Invalid constructor call: Use static factory methods instead');
    }
    
    this.prompts = prompts;
    this.modelQuery = modelQuery;
    this._isAutoSend = isAutoSend;
    this.isUseClipboard = isUseClipboard;
    this._isRequiredLogin = isRequiredLogin;
    this.#isQueryParameterDetected = isQueryParameterDetected;
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

  static async generate({ prompts = null, modelQuery = null, isAutoSend = null, isUseClipboard = null, isRequiredLogin = null} = {}) {
    const promptTexts = prompts
      ? await Promise.all(prompts.map(prompt => QueryParameter.#processPrompt(prompt, isUseClipboard)))
      : [];

    return new QueryParameter({
      prompts: promptTexts,
      modelQuery: modelQuery,
      isAutoSend: isAutoSend,
      isUseClipboard: isUseClipboard,
      isRequiredLogin: isRequiredLogin,
      isQueryParameterDetected: false,
      token: QueryParameter.#PRIVATE_TOKEN
    });
  }

  static async generateFromBackground() {
    const response = await QueryParameter.#fetchParameters();
    const promptTexts = response.prompts
      ? await Promise.all(response.prompts.map(prompt => QueryParameter.#processPrompt(prompt, response.clipboard)))
      : [];
    const modelQuery = QueryParameter.#processModel(response.model);
    const isAutoSend = QueryParameter.#convertToBoolean(response.send);
    const isRequiredLogin = response.requiredLogin !== null 
      ? QueryParameter.#convertToBoolean(response.requiredLogin) 
      : null;
    const isQueryParameterDetected = response.isQueryParameterDetected || false;

    return new QueryParameter({
      prompts: promptTexts,
      modelQuery: modelQuery,
      isAutoSend: isAutoSend,
      isUseClipboard: null,
      isRequiredLogin: isRequiredLogin,
      isQueryParameterDetected: isQueryParameterDetected,
      token: QueryParameter.#PRIVATE_TOKEN
    });
  }

  static async generateFromFragment(fragmentParams) {
    const promptTexts = fragmentParams.getAll('ext-q');
    const modelValue = fragmentParams.get('ext-m');
    const sendValue = fragmentParams.get('ext-send');
    const clipboardValue = fragmentParams.get('ext-clipboard');
    const requiredLoginValue = fragmentParams.get('ext-required-login');

    const processedPrompts = promptTexts.length > 0
      ? await Promise.all(promptTexts.map(prompt => QueryParameter.#processPrompt(prompt, clipboardValue)))
      : [];
    const modelQuery = QueryParameter.#processModel(modelValue);
    const isAutoSend = QueryParameter.#convertToBoolean(sendValue);
    const isRequiredLogin = requiredLoginValue !== null 
      ? QueryParameter.#convertToBoolean(requiredLoginValue) 
      : null;

    return new QueryParameter({
      prompts: processedPrompts,
      modelQuery: modelQuery,
      isAutoSend: isAutoSend,
      isUseClipboard: null,
      isRequiredLogin: isRequiredLogin,
      isQueryParameterDetected: false,
      token: QueryParameter.#PRIVATE_TOKEN
    });
  }

  static hasTargetParameters(urlOrParams) {
    const targetParams = ['ext-q', 'ext-m', 'ext-send', 'ext-clipboard', 'ext-required-login'];
    return targetParams.some(param => urlOrParams.has(param));
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

  isRequiredLogin() {
    return this._isRequiredLogin;
  }
  
  isQueryParameterDetected() {
    return this.#isQueryParameterDetected;
  }
  
  buildUrl(location) {
    const url = new URL(location.origin + location.pathname);
    const params = new URLSearchParams();

    if (this.modelQuery) {
      params.set('ext-m', this.modelQuery.getIdentifierString());
    }

    if (this.prompts) {
      for (let prompt of this.prompts) {
        params.append('ext-q', prompt);
      }
      if (this._isAutoSend) {
        params.set('ext-send', '1');
      }
      const hasClipboardKeyword = this.prompts.some(p =>
        p.includes(QueryParameter.CLIPBOARD_KEYWORD)
      );
      if (hasClipboardKeyword && this.isUseClipboard !== false) {
        params.set('ext-clipboard', '1');
      }
    }

    if (this._isRequiredLogin !== null) {
      params.set('ext-required-login', this._isRequiredLogin ? '1' : '0');
    }

    if ([...params].length > 0) {
      url.hash = params.toString();
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
