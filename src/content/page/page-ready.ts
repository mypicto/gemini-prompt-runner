import { waitForQuiet } from '../../shared/async/wait-for.js';
import { REQUIRED_READY_IDS } from '../../shared/config/selector-ids.js';
import { TIMING } from '../../shared/config/timing.js';
import type { ElementLocator } from './element-locator.js';

/**
 * Gemini ページの主要素が出揃うまで待つ。
 * タイムアウトしても throw せず続行する — 要素が本当に無ければ
 * 後続の ElementLocator.find が失敗として SelectorHealth に記録する。
 */
export class PageReady {
  constructor(private readonly locator: ElementLocator) {}

  async waitUntilReady(): Promise<boolean> {
    return waitForQuiet(
      () => REQUIRED_READY_IDS.every((id) => this.locator.exists(id)),
      {
        timeoutMs: TIMING.uiReadyTimeoutMs,
        intervalMs: TIMING.uiReadyPollIntervalMs,
      }
    );
  }
}
