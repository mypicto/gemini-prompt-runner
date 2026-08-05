import type { KeyValueStore } from '../platform/storage.js';

export interface SelectorStatus {
  lastSuccessTime: number | null;
  hasError: boolean;
  errorMessage: string;
}

export type CustomSelectorMap = Record<string, string>;
export type SelectorStatusMap = Record<string, SelectorStatus>;

export interface SelectorRepositoryPort {
  getCustomSelectors(): Promise<CustomSelectorMap>;
  saveCustomSelectors(map: CustomSelectorMap): Promise<void>;
  getSelectorStatus(): Promise<SelectorStatusMap>;
  saveSelectorStatus(map: SelectorStatusMap): Promise<void>;
}

/**
 * セレクタ設定の永続化。ストレージキー ('customSelectors' / 'selectorStatus') は
 * 既存ユーザーの保存データとの互換性があるため変更しないこと。
 */
export class StorageSelectorRepository implements SelectorRepositoryPort {
  constructor(private readonly store: KeyValueStore) {}

  async getCustomSelectors(): Promise<CustomSelectorMap> {
    return (await this.store.get<CustomSelectorMap>('customSelectors')) ?? {};
  }

  async saveCustomSelectors(map: CustomSelectorMap): Promise<void> {
    await this.store.set('customSelectors', map);
  }

  async getSelectorStatus(): Promise<SelectorStatusMap> {
    return (await this.store.get<SelectorStatusMap>('selectorStatus')) ?? {};
  }

  async saveSelectorStatus(map: SelectorStatusMap): Promise<void> {
    await this.store.set('selectorStatus', map);
  }
}
