import type {
  CustomSelectorMap,
  SelectorRepositoryPort,
  SelectorStatusMap,
} from './selector-repository.js';

/** 単体テスト・Playwright 注入テスト用のインメモリ実装 (chrome.storage 非依存) */
export class MemorySelectorRepository implements SelectorRepositoryPort {
  #customSelectors: CustomSelectorMap = {};
  #selectorStatus: SelectorStatusMap = {};

  async getCustomSelectors(): Promise<CustomSelectorMap> {
    return { ...this.#customSelectors };
  }

  async saveCustomSelectors(map: CustomSelectorMap): Promise<void> {
    this.#customSelectors = { ...map };
  }

  async getSelectorStatus(): Promise<SelectorStatusMap> {
    return { ...this.#selectorStatus };
  }

  async saveSelectorStatus(map: SelectorStatusMap): Promise<void> {
    this.#selectorStatus = { ...map };
  }
}
