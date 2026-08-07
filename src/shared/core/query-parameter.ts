import { ALL_EXT_PARAMS, CLIPBOARD_KEYWORD, EXT_PARAMS } from '../config/ext-params.js';
import {
  FallbackModelQuery,
  IdentifierModelQuery,
  ModelQuery,
  NominalModelQuery,
} from './model-query.js';

/**
 * background → content の wire、および toJSON の出力形。
 * 既存バージョンとの互換性があるためフィールド名を変えないこと。
 */
export interface QueryParameterDto {
  __type: 'QueryParameter';
  prompts: string[] | null;
  /** ModelQuery.getIdentifierString() の出力 */
  modelQuery: string | null;
  send: boolean | null;
  clipboard: boolean | null;
  requiredLogin: boolean | null;
  queryParameterDetected: boolean;
}

export interface QueryParameterInit {
  prompts?: readonly string[] | null;
  modelQuery?: ModelQuery | null;
  isAutoSend?: boolean | null;
  isUseClipboard?: boolean | null;
  isRequiredLogin?: boolean | null;
}

/**
 * ext-* URL パラメータの解析・保持・シリアライズ・URL 生成。
 * クリップボード置換や改行正規化などプロンプト本文の加工は
 * content/prompt-assembler.ts の責務 (このクラスは I/O を持たない)。
 */
export class QueryParameter {
  private constructor(
    readonly prompts: readonly string[] | null,
    private readonly modelQuery: ModelQuery | null,
    private readonly autoSend: boolean | null,
    readonly isUseClipboard: boolean | null,
    private readonly requiredLogin: boolean | null,
    private readonly queryParameterDetected: boolean
  ) {}

  static generate(init: QueryParameterInit = {}): QueryParameter {
    return new QueryParameter(
      init.prompts ?? null,
      init.modelQuery ?? null,
      init.isAutoSend ?? null,
      init.isUseClipboard ?? null,
      init.isRequiredLogin ?? null,
      false
    );
  }

  static generateFromJson(json: QueryParameterDto): QueryParameter {
    return new QueryParameter(
      json.prompts,
      json.modelQuery ? QueryParameter.parseModel(json.modelQuery) : null,
      json.send,
      json.clipboard,
      json.requiredLogin,
      json.queryParameterDetected
    );
  }

  static generateFromUrl(url: URL | string): QueryParameter {
    const urlObj = new URL(url);
    const queryParams = urlObj.searchParams;
    const fragmentParams = QueryParameter.extractFragmentParameters(urlObj);

    // クエリ形式はサーバに送信されるため「漏洩あり」として警告対象になる。
    // フラグメント形式はサーバに到達しないので検出扱いにしない。
    const queryParameterDetected = QueryParameter.hasTargetParameters(queryParams);

    const prompts = [
      ...queryParams.getAll(EXT_PARAMS.prompt),
      ...fragmentParams.getAll(EXT_PARAMS.prompt),
    ];
    const model = queryParams.get(EXT_PARAMS.model) || fragmentParams.get(EXT_PARAMS.model);
    const send = queryParams.get(EXT_PARAMS.send) || fragmentParams.get(EXT_PARAMS.send);
    const clipboard =
      queryParams.get(EXT_PARAMS.clipboard) || fragmentParams.get(EXT_PARAMS.clipboard);
    const requiredLogin =
      queryParams.get(EXT_PARAMS.requiredLogin) || fragmentParams.get(EXT_PARAMS.requiredLogin);

    return new QueryParameter(
      prompts,
      QueryParameter.parseModel(model),
      QueryParameter.toBoolean(send),
      QueryParameter.toBoolean(clipboard),
      requiredLogin !== null ? QueryParameter.toBoolean(requiredLogin) : null,
      queryParameterDetected
    );
  }

  static hasTargetParametersInUrl(url: URL): boolean {
    return (
      QueryParameter.hasTargetParameters(url.searchParams) ||
      QueryParameter.hasTargetParameters(QueryParameter.extractFragmentParameters(url))
    );
  }

  /** ext-* クエリのみ除去し (他のクエリは保持)、フラグメントは全消去した URL を返す */
  static removeQueryAndFragment(url: URL): URL {
    for (const name of ALL_EXT_PARAMS) {
      url.searchParams.delete(name);
    }
    url.hash = '';
    return url;
  }

  getModelQuery(): ModelQuery | null {
    return this.modelQuery;
  }

  isAutoSend(): boolean | null {
    return this.autoSend;
  }

  isRequiredLogin(): boolean | null {
    return this.requiredLogin;
  }

  isQueryParameterDetected(): boolean {
    return this.queryParameterDetected;
  }

  toJSON(): QueryParameterDto {
    return {
      __type: 'QueryParameter',
      prompts: this.prompts ? [...this.prompts] : null,
      modelQuery: this.modelQuery ? this.modelQuery.getIdentifierString() : null,
      send: this.autoSend,
      clipboard: this.isUseClipboard,
      requiredLogin: this.requiredLogin,
      queryParameterDetected: this.queryParameterDetected,
    };
  }

  /**
   * 共有用 URL を生成する。パラメータはサーバに漏れないよう
   * 必ずフラグメント形式 (#ext-q=...) で出力する。
   */
  buildUrl(location: Pick<Location, 'origin' | 'pathname'>): string {
    const url = new URL(location.origin + location.pathname);
    const params = new URLSearchParams();

    if (this.modelQuery) {
      params.set(EXT_PARAMS.model, this.modelQuery.getIdentifierString());
    }
    if (this.prompts) {
      for (const prompt of this.prompts) {
        params.append(EXT_PARAMS.prompt, prompt);
      }
      if (this.autoSend) {
        params.set(EXT_PARAMS.send, '1');
      }
      const hasClipboardKeyword = this.prompts.some((p) => p.includes(CLIPBOARD_KEYWORD));
      if (hasClipboardKeyword && this.isUseClipboard !== false) {
        params.set(EXT_PARAMS.clipboard, '1');
      }
    }
    if (this.requiredLogin !== null) {
      params.set(EXT_PARAMS.requiredLogin, this.requiredLogin ? '1' : '0');
    }

    if ([...params].length > 0) {
      url.hash = params.toString();
    }
    return url.toString();
  }

  private static extractFragmentParameters(url: URL): URLSearchParams {
    if (url.hash && url.hash.length > 1) {
      return new URLSearchParams(url.hash.substring(1));
    }
    return new URLSearchParams();
  }

  private static hasTargetParameters(params: URLSearchParams): boolean {
    return ALL_EXT_PARAMS.some((param) => params.has(param));
  }

  private static parseModel(model: string | null): ModelQuery | null {
    if (model === null) {
      return null;
    }
    if (/^\d+$/.test(model)) {
      return new IdentifierModelQuery(parseInt(model, 10));
    }
    const names = model
      .split(',')
      .map((name) => name.trim())
      .filter((name) => name !== '');
    if (names.length === 0) {
      return null;
    }
    if (names.length === 1) {
      return new NominalModelQuery(names[0]!);
    }
    return new FallbackModelQuery(names.map((name) => new NominalModelQuery(name)));
  }

  private static toBoolean(value: string | boolean | null): boolean {
    return value === 'true' || value === '1' || value === true;
  }
}
