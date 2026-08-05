import { DEFAULT_SELECTORS, SELECTOR_IDS, type SelectorId } from '../config/selector-ids.js';
import type { SelectorRepositoryPort } from './selector-repository.js';

/**
 * デフォルトセレクタ (バンドル同梱) とカスタムセレクタ (storage) のマージと CRUD。
 * 更新系は変更が起きたかを返すので、呼び出し側が SelectorHealth のリセットを判断する。
 */
export class SelectorSettings {
  #mutex: Promise<unknown> = Promise.resolve();

  constructor(private readonly repository: SelectorRepositoryPort) {}

  getDefaultSelector(id: SelectorId): string {
    return DEFAULT_SELECTORS[id].selector;
  }

  async getCustomSelector(id: SelectorId): Promise<string> {
    const customs = await this.repository.getCustomSelectors();
    return customs[id] ?? '';
  }

  /** 空文字のカスタムは「未設定」としてデフォルトへフォールバックする */
  async getMergedSelectors(): Promise<Record<SelectorId, string>> {
    const customs = await this.repository.getCustomSelectors();
    const merged = {} as Record<SelectorId, string>;
    for (const id of SELECTOR_IDS) {
      const custom = customs[id];
      merged[id] = custom && custom.trim() !== '' ? custom : this.getDefaultSelector(id);
    }
    return merged;
  }

  /** @returns セレクタ値が実際に変わったか */
  async updateCustomSelector(id: SelectorId, selector: string): Promise<boolean> {
    return this.#withMutex(async () => {
      const customs = await this.repository.getCustomSelectors();
      const changed = (customs[id] ?? '') !== selector;
      customs[id] = selector;
      await this.repository.saveCustomSelectors(customs);
      return changed;
    });
  }

  /** @returns カスタムが存在して除去されたか */
  async resetToDefault(id: SelectorId): Promise<boolean> {
    return this.#withMutex(async () => {
      const customs = await this.repository.getCustomSelectors();
      const changed = customs[id] !== undefined;
      delete customs[id];
      await this.repository.saveCustomSelectors(customs);
      return changed;
    });
  }

  /** @returns 除去されたカスタムセレクタの ID 一覧 */
  async clearAllCustomSelectors(): Promise<string[]> {
    return this.#withMutex(async () => {
      const customs = await this.repository.getCustomSelectors();
      const changedIds = Object.keys(customs);
      await this.repository.saveCustomSelectors({});
      return changedIds;
    });
  }

  /** 読み書きの間に別の更新が割り込まないよう、更新系を直列化する */
  #withMutex<T>(operation: () => Promise<T>): Promise<T> {
    const next = this.#mutex.then(operation, operation);
    this.#mutex = next.catch(() => undefined);
    return next;
  }
}
