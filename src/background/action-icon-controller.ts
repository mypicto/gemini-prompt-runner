import { DEFAULT_ICON, iconPathFor, type IconState } from '../shared/config/icons.js';
import { log } from '../shared/logging.js';
import type { ActionIconPort } from '../shared/platform/action-icon.js';

/**
 * ツールバーアイコンの状態管理。content から届く IconState (意味) をパスに解決し、
 * タブごとの最終状態を覚えてタブ切替時に復元する。
 * アイコンは装飾のため、設定失敗はログに留めて処理を止めない。
 */
export class ActionIconController {
  readonly #tabIcons = new Map<number, string>();

  constructor(private readonly port: ActionIconPort) {}

  async apply(tabId: number | undefined, state: IconState): Promise<void> {
    const path = iconPathFor(state);
    try {
      await this.port.setIcon(tabId, path);
      if (tabId !== undefined) {
        this.#tabIcons.set(tabId, path);
      }
    } catch (error) {
      log.error('failed to set toolbar icon:', error);
    }
  }

  /** タブ切替時: そのタブで最後に設定したアイコン (なければデフォルト) に戻す */
  async restore(tabId: number): Promise<void> {
    const path = this.#tabIcons.get(tabId) ?? DEFAULT_ICON;
    try {
      await this.port.setIcon(tabId, path);
    } catch (error) {
      log.error('failed to restore toolbar icon:', error);
    }
  }

  forget(tabId: number): void {
    this.#tabIcons.delete(tabId);
  }
}
