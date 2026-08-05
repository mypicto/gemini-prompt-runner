import type { KeyValueStore } from '../shared/platform/storage.js';

/** 共有 URL 生成パネルのチェックボックス状態 */
export interface ShareOptions {
  includeModel: boolean;
  includePrompt: boolean;
  autoSend: boolean;
  requiredLogin: boolean;
  redirectUrl: boolean;
}

/** 既存ユーザーの保存データとの互換性があるため変更しないこと */
const STORAGE_KEY = 'urlGenerateOptions';

const DEFAULT_OPTIONS: ShareOptions = {
  includeModel: true,
  includePrompt: true,
  autoSend: false,
  requiredLogin: false,
  redirectUrl: false,
};

/**
 * 共有 URL 生成オプションの永続化。
 * 旧バージョンが部分的なオブジェクトを保存している可能性があるため、
 * 読み出し時は常にデフォルト値へマージする。
 */
export class ShareOptionsStore {
  constructor(private readonly store: KeyValueStore) {}

  async get(): Promise<ShareOptions> {
    const saved = await this.store.get<Partial<ShareOptions>>(STORAGE_KEY);
    return { ...DEFAULT_OPTIONS, ...saved };
  }

  async save(options: ShareOptions): Promise<void> {
    await this.store.set(STORAGE_KEY, options);
  }
}
