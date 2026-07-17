/**
 * chrome.storage の抽象。用途による使い分けは composition root (main.ts) が決める:
 * - sync:  セレクタ設定 (端末間で共有したい)
 * - local: 共有 URL 生成オプション (端末ローカルでよい)
 */
export interface KeyValueStore {
  get<T>(key: string): Promise<T | undefined>;
  set(key: string, value: unknown): Promise<void>;
}

class ChromeStorageStore implements KeyValueStore {
  constructor(private readonly area: () => chrome.storage.StorageArea) {}

  async get<T>(key: string): Promise<T | undefined> {
    const result = await this.area().get([key]);
    return result[key] as T | undefined;
  }

  async set(key: string, value: unknown): Promise<void> {
    await this.area().set({ [key]: value });
  }
}

export function createChromeSyncStore(): KeyValueStore {
  return new ChromeStorageStore(() => chrome.storage.sync);
}

export function createChromeLocalStore(): KeyValueStore {
  return new ChromeStorageStore(() => chrome.storage.local);
}

/** 単体テスト・Playwright 注入テスト用のインメモリ実装 */
export class MemoryStore implements KeyValueStore {
  readonly #data = new Map<string, unknown>();

  async get<T>(key: string): Promise<T | undefined> {
    return this.#data.get(key) as T | undefined;
  }

  async set(key: string, value: unknown): Promise<void> {
    this.#data.set(key, value);
  }
}
