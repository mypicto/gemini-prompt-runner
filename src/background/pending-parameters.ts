import { QueryParameter, type QueryParameterDto } from '../shared/core/query-parameter.js';

/**
 * webRequest で捕捉した ext-* パラメータを、content script が
 * requestParameters メッセージで引き取りに来るまで保持する。
 */
export class PendingParameters {
  #pending = QueryParameter.generate();

  capture(url: string): void {
    const urlObj = new URL(url);
    if (QueryParameter.hasTargetParametersInUrl(urlObj)) {
      this.#pending = QueryParameter.generateFromUrl(urlObj);
    }
  }

  /** 払い出すと空に戻る (再取得で二重実行しないための一度きりの受け渡し) */
  take(): QueryParameterDto {
    const dto = this.#pending.toJSON();
    this.#pending = QueryParameter.generate();
    return dto;
  }
}
