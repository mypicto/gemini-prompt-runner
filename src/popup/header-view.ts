import type { RuntimeInfoPort } from '../shared/platform/runtime-info.js';

/**
 * popup ヘッダ (タイトル / 拡張名 / バージョン) を manifest の情報で埋める。
 */
export class HeaderView {
  readonly #document: Document;
  readonly #runtimeInfo: RuntimeInfoPort;

  constructor(deps: { document: Document; runtimeInfo: RuntimeInfoPort }) {
    this.#document = deps.document;
    this.#runtimeInfo = deps.runtimeInfo;
  }

  apply(): void {
    const name = this.#runtimeInfo.name;
    this.#document.title = name;

    const appName = this.#document.getElementById('appName');
    if (appName) {
      appName.textContent = name;
    }
    const appVersion = this.#document.getElementById('appVersion');
    if (appVersion) {
      appVersion.textContent = `ver${this.#runtimeInfo.version}`;
    }
  }
}
