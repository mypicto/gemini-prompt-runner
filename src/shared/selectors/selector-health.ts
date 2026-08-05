import type {
  SelectorRepositoryPort,
  SelectorStatus,
} from './selector-repository.js';

const INITIAL_STATUS: SelectorStatus = {
  lastSuccessTime: null,
  hasError: false,
  errorMessage: '',
};

/**
 * セレクタ解決の成功/失敗の記録。Gemini UI 変更でセレクタが壊れたとき、
 * options 画面がこの記録を表示してユーザーの調査を助ける。
 */
export class SelectorHealth {
  #mutex: Promise<unknown> = Promise.resolve();

  constructor(private readonly repository: SelectorRepositoryPort) {}

  async get(id: string): Promise<SelectorStatus> {
    const statuses = await this.repository.getSelectorStatus();
    return statuses[id] ?? { ...INITIAL_STATUS };
  }

  async recordSuccess(id: string): Promise<void> {
    await this.#update(id, (status) => ({
      ...status,
      lastSuccessTime: Date.now(),
      hasError: false,
      errorMessage: '',
    }));
  }

  /** 直前の成功時刻は保持したままエラーを記録する */
  async recordFailure(id: string, errorMessage: string): Promise<void> {
    await this.#update(id, (status) => ({
      ...status,
      hasError: true,
      errorMessage,
    }));
  }

  async reset(id: string): Promise<void> {
    await this.#update(id, () => ({ ...INITIAL_STATUS }));
  }

  async resetMany(ids: readonly string[]): Promise<void> {
    for (const id of ids) {
      await this.reset(id);
    }
  }

  async #update(
    id: string,
    mutate: (status: SelectorStatus) => SelectorStatus
  ): Promise<void> {
    const operation = async () => {
      const statuses = await this.repository.getSelectorStatus();
      statuses[id] = mutate(statuses[id] ?? { ...INITIAL_STATUS });
      await this.repository.saveSelectorStatus(statuses);
    };
    const next = this.#mutex.then(operation, operation);
    this.#mutex = next.catch(() => undefined);
    await next;
  }
}
