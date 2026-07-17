import { GEMINI_APP_PATH, GEMINI_ORIGIN } from '../shared/config/urls.js';
import { IdentifierModelQuery } from '../shared/core/model-query.js';
import { QueryParameter } from '../shared/core/query-parameter.js';
import { log } from '../shared/logging.js';
import type { RuntimeInfoPort } from '../shared/platform/runtime-info.js';
import type { TabsPort } from '../shared/platform/tabs.js';
import type { Localizer } from '../shared/ui/localize.js';

/**
 * 「使い方」テキスト (#manualUrl) のクリックで、同梱の README プロンプトを
 * ext-q に載せた Gemini URL を組み立てて新規タブで開くデモ導線。
 */
export class ManualLauncher {
  readonly #document: Document;
  readonly #localizer: Localizer;
  readonly #runtimeInfo: RuntimeInfoPort;
  readonly #tabs: TabsPort;

  constructor(deps: {
    document: Document;
    localizer: Localizer;
    runtimeInfo: RuntimeInfoPort;
    tabs: TabsPort;
  }) {
    this.#document = deps.document;
    this.#localizer = deps.localizer;
    this.#runtimeInfo = deps.runtimeInfo;
    this.#tabs = deps.tabs;
  }

  attach(): void {
    const element = this.#document.getElementById('manualUrl');
    if (!element) {
      return;
    }
    element.addEventListener('click', () => {
      void this.#openManual().catch((error: unknown) =>
        log.error('Failed to fetch prompt URL:', error)
      );
    });
  }

  async #openManual(): Promise<void> {
    const promptPath = this.#localizer.getMessage('promptReadmeURL');
    // fetch はグローバル API だが、popup (拡張ページ) で自身の同梱リソースを
    // 読むだけなので main.ts 集約ルールの例外として使用を許可している。
    const response = await fetch(this.#runtimeInfo.getURL(promptPath));
    const text = await response.text();
    const queryParameter = QueryParameter.generate({
      prompts: text ? [text] : null,
      modelQuery: new IdentifierModelQuery(0),
      isAutoSend: true,
      isUseClipboard: false,
    });
    await this.#tabs.create(
      queryParameter.buildUrl({ origin: GEMINI_ORIGIN, pathname: GEMINI_APP_PATH })
    );
  }
}
