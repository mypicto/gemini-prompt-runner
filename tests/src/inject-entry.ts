/**
 * Playwright MCP テスト用エントリ。本番の page/ コンポーネントと shared 層を
 * chrome.* 非依存 (MemorySelectorRepository) で組み立て、実 Gemini ページ上で
 * セレクタ解決とコンポーネント動作を検証する API を返す。
 *
 * ビルド: npm run build:inject → tests/dist/inject-bundle.js (IIFE)
 */
import { LoginLink } from '../../src/content/page/login-link.js';
import { ModelMenu } from '../../src/content/page/model-menu.js';
import { PromptTextarea } from '../../src/content/page/prompt-textarea.js';
import { ResponseCopyButton } from '../../src/content/page/response-copy-button.js';
import { SendButton } from '../../src/content/page/send-button.js';
import { ElementLocator } from '../../src/content/page/element-locator.js';
import {
  DEFAULT_SELECTORS,
  SELECTOR_IDS,
  type SelectorId,
} from '../../src/shared/config/selector-ids.js';
import {
  FallbackModelQuery,
  NominalModelQuery,
} from '../../src/shared/core/model-query.js';
import { QueryParameter } from '../../src/shared/core/query-parameter.js';
import { MemorySelectorRepository } from '../../src/shared/selectors/memory-selector-repository.js';
import { SelectorHealth } from '../../src/shared/selectors/selector-health.js';
import { SelectorSettings } from '../../src/shared/selectors/selector-settings.js';

export async function bootstrap() {
  const repository = new MemorySelectorRepository();
  const locator = new ElementLocator({
    settings: new SelectorSettings(repository),
    health: new SelectorHealth(repository),
    root: document,
  });
  await locator.init();

  const modelSelector = new ModelMenu(locator);
  const sendButton = new SendButton(locator);
  const textarea = new PromptTextarea({ locator, document });
  const copyButton = new ResponseCopyButton(locator);
  const loginButton = new LoginLink(locator);

  // 旧シナリオ手順 (selectorService.getElement 形式) との互換シム
  const selectorService = {
    getElement: (id: SelectorId, timeoutMs = 1000, context?: ParentNode) =>
      locator.find(id, { timeoutMs, context }),
    getElements: (id: SelectorId, timeoutMs = 1000, context?: ParentNode) =>
      locator.findAll(id, { timeoutMs, context }),
    existsElement: (id: SelectorId, context?: ParentNode) => locator.exists(id, context),
  };

  async function probe(id: SelectorId, timeoutMs = 1500) {
    try {
      const el = await locator.find(id, { timeoutMs });
      return {
        id,
        found: true,
        tag: el.tagName,
        visible: !!el.offsetParent,
        selector: DEFAULT_SELECTORS[id].selector,
      };
    } catch (e) {
      return {
        id,
        found: false,
        error: e instanceof Error ? e.message : String(e),
        selector: DEFAULT_SELECTORS[id].selector,
      };
    }
  }

  async function probeAll(ids: readonly SelectorId[] = SELECTOR_IDS, timeoutMs = 1500) {
    const results = [];
    for (const id of ids) {
      results.push(await probe(id, timeoutMs));
    }
    return results;
  }

  return {
    locator,
    selectorService,
    selectors: DEFAULT_SELECTORS,
    modelSelector,
    sendButton,
    textarea,
    copyButton,
    loginButton,
    NominalModelQuery,
    FallbackModelQuery,
    QueryParameter,
    probe,
    probeAll,
  };
}
