import { QueryParameter } from '../shared/core/query-parameter.js';
import type { BackgroundClient } from '../shared/platform/messaging.js';

/**
 * 実行すべき ext-* パラメータの取得。経路は2つ:
 * 1. フラグメント経路 (#ext-q=...): サーバに漏れない推奨形式。URL から直接読み取り、
 *    履歴・共有に残らないよう即座に URL を浄化する
 * 2. クエリ経路 (?ext-q=...): background の webRequest が捕捉済みなので message で引き取る
 */
export class ParameterSource {
  #capturedFromFragment: QueryParameter | null = null;

  constructor(
    private readonly deps: {
      location: Location;
      history: History;
      document: Document;
      background: BackgroundClient;
    }
  ) {}

  /** document_start で即時に呼ぶこと (浄化が遅れるほど漏洩ウィンドウが広がる) */
  captureFromLocation(): void {
    const url = new URL(this.deps.location.href);
    if (!QueryParameter.hasTargetParametersInUrl(url)) {
      return;
    }
    this.#capturedFromFragment = QueryParameter.generateFromUrl(url);
    const sanitized = QueryParameter.removeQueryAndFragment(url);
    this.deps.history.replaceState(null, this.deps.document.title, sanitized.toString());
  }

  async resolve(): Promise<QueryParameter> {
    if (this.#capturedFromFragment) {
      return this.#capturedFromFragment;
    }
    const dto = await this.deps.background.send('requestParameters');
    return QueryParameter.generateFromJson(dto);
  }
}
