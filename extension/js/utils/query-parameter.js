import { IdentifierModelQuery } from '../models/model-query.js';
import { NominalModelQuery } from '../models/model-query.js';
import { ClipboardService } from '../services/clipboard-service.js';

export class QueryParameter {
  static CLIPBOARD_KEYWORD = '{{clipboard}}';
  static #PRIVATE_TOKEN = Symbol('QueryParameterToken');
  static #PARAMETER_NAMES = ['ext-q', 'ext-m', 'ext-send', 'ext-clipboard', 'ext-required-login'];
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

  static generate({ prompts = null, modelQuery = null, isAutoSend = null, isUseClipboard = null, isRequiredLogin = null} = {}) {
    return new QueryParameter({
      prompts: prompts,
      modelQuery: modelQuery,
      isAutoSend: isAutoSend,
      isUseClipboard: isUseClipboard,
      isRequiredLogin: isRequiredLogin,
      isQueryParameterDetected: false,
      token: QueryParameter.#PRIVATE_TOKEN
    });
  }

  static generateFromJson(json) {
    const prompts = json.prompts;
    const modelQuery = json.modelQuery
      ? QueryParameter.#processModel(json.modelQuery)
      : null;
    return new QueryParameter({
      prompts,
      modelQuery,
      isAutoSend: json.send,
      isUseClipboard: json.clipboard,
      isRequiredLogin: json.requiredLogin,
      isQueryParameterDetected: json.queryParameterDetected,
      token: QueryParameter.#PRIVATE_TOKEN
    });
  }
  
  static generateFromUrl(url) {
    const urlObj = new URL(url);
    const queryParams = urlObj.searchParams;
    const fragmentParams = QueryParameter.#extractFragmentParameters(urlObj);
    const isQueryParameterDetected = QueryParameter.#hasTargetParameters(queryParams);
    
    const prompts = [...queryParams.getAll('ext-q'), ...fragmentParams.getAll('ext-q')];
    const model = queryParams.get('ext-m') || fragmentParams.get('ext-m');
    const send = queryParams.get('ext-send') || fragmentParams.get('ext-send');
    const clipboard = queryParams.get('ext-clipboard') || fragmentParams.get('ext-clipboard');
    const requiredLogin = queryParams.get('ext-required-login') || fragmentParams.get('ext-required-login');
    
    const modelQuery = QueryParameter.#processModel(model);
    const isAutoSend = QueryParameter.#convertToBoolean(send);
    const isUseClipboard = QueryParameter.#convertToBoolean(clipboard);
    const isRequiredLogin = requiredLogin !== null 
      ? QueryParameter.#convertToBoolean(requiredLogin) 
      : null;
    
    return new QueryParameter({
      prompts: prompts,
      modelQuery: modelQuery,
      isAutoSend: isAutoSend,
      isUseClipboard: isUseClipboard,
      isRequiredLogin: isRequiredLogin,
      isQueryParameterDetected: isQueryParameterDetected,
      token: QueryParameter.#PRIVATE_TOKEN
    });
  }

  static hasTargetParametersInUrl(url) {
    const queryParams = url.searchParams;
    const fragmentParams = QueryParameter.#extractFragmentParameters(url);
    return this.#hasTargetParameters(queryParams) || this.#hasTargetParameters(fragmentParams);
  }

  static removeQueryAndFragment(url) {
    for (const name of QueryParameter.#PARAMETER_NAMES) {
      url.searchParams.delete(name);
    }
    url.hash = '';
    return url;
  }

  async buildPromptTexts() {
    const promptTexts = this.prompts
      ? await Promise.all(this.prompts.map(prompt => QueryParameter.#processPrompt(prompt, this.isUseClipboard)))
      : [];

    return promptTexts;
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

  toJSON() {
    const json = {
      __type: 'QueryParameter',
      prompts: this.prompts,
      modelQuery: this.modelQuery ? this.modelQuery.getIdentifierString() : null,
      send: this._isAutoSend,
      clipboard: this.isUseClipboard,
      requiredLogin: this._isRequiredLogin,
      queryParameterDetected: this.#isQueryParameterDetected
    };
    return json;
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

  static #extractFragmentParameters(url) {
    if (url.hash && url.hash.length > 1) {
      return new URLSearchParams(url.hash.substring(1));
    }
    return new URLSearchParams();
  }

  static #hasTargetParameters(params) {
    return QueryParameter.#PARAMETER_NAMES.some(param => params.has(param));
  }

  static async #processPrompt(promptText, clipboard) {
    if (promptText) {
      const keyword = QueryParameter.CLIPBOARD_KEYWORD;
      const isUseClipboard = QueryParameter.#convertToBoolean(clipboard);
      const clipboardService = new ClipboardService();
      if (isUseClipboard && promptText.includes(keyword)) {
        let clipboardText = '';
        try {
          clipboardText = await clipboardService.read() || '';
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
    return (value === 'true' || value === '1' || value === true);
  }
}

class LineEndingConverter {
  static convertToLF(text) {
    return text.replace(/\r\n|\r/g, '\n');
  }
}
