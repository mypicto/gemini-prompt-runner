import { log } from '../shared/logging.js';
import type { TabClient } from '../shared/platform/messaging.js';

/**
 * アクティブタブの content にクエリ形式 (?ext-q=... サーバ漏洩) の
 * パラメータ検出を問い合わせ、#queryWarningContainer の表示を切り替える。
 *
 * 旧実装はタブ URL の 'gemini.google.com' 部分文字列判定を挟んでいたが、
 * 偽陽性がある (例: パスに文字列を含む他サイト) ため廃止した。
 * content が応答しないタブ (= Gemini ページでない) は sendToActiveTab が
 * null を返すので、それをもって非表示にすれば十分。
 */
export class QueryWarningView {
  readonly #document: Document;
  readonly #tabClient: TabClient;

  constructor(deps: { document: Document; tabClient: TabClient }) {
    this.#document = deps.document;
    this.#tabClient = deps.tabClient;
  }

  async check(): Promise<void> {
    const container = this.#document.getElementById('queryWarningContainer');
    if (!container) {
      return;
    }
    try {
      const response = await this.#tabClient.sendToActiveTab('checkQueryParameterDetection');
      if (response?.detected) {
        container.classList.remove('hidden');
      } else {
        container.classList.add('hidden');
      }
    } catch (error) {
      log.error('Error checking query parameter detection:', error);
      container.classList.add('hidden');
    }
  }
}
