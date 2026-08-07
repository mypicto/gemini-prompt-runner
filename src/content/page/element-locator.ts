import { TimeoutError } from '../../shared/async/errors.js';
import { waitFor } from '../../shared/async/wait-for.js';
import type { SelectorId } from '../../shared/config/selector-ids.js';
import { TIMING } from '../../shared/config/timing.js';
import type { SelectorHealth } from '../../shared/selectors/selector-health.js';
import type { SelectorSettings } from '../../shared/selectors/selector-settings.js';

export interface LocateOptions {
  timeoutMs?: number;
  /** 探索の起点。省略時はページ全体 */
  context?: ParentNode;
}

/**
 * セレクタ ID から Gemini ページ上の要素を解決する。
 * CSS セレクタ文字列を知るのはこのクラスまで — page/ の各ページオブジェクトは ID だけを使う。
 * 解決の成否は SelectorHealth に記録され、options 画面で確認できる。
 */
export class ElementLocator {
  #selectors: Record<SelectorId, string> | null = null;

  constructor(
    private readonly deps: {
      settings: SelectorSettings;
      health: SelectorHealth;
      root: Document;
    }
  ) {}

  /** カスタムセレクタ (storage) とのマージ結果を読み込む。要素解決の前に一度呼ぶ */
  async init(): Promise<void> {
    this.#selectors = await this.deps.settings.getMergedSelectors();
  }

  exists(id: SelectorId, context: ParentNode = this.deps.root): boolean {
    return context.querySelector(this.#selectorOf(id)) !== null;
  }

  /** 要素が現れるまでポーリングして返す。見つからなければ TimeoutError */
  async find(id: SelectorId, options: LocateOptions = {}): Promise<HTMLElement> {
    return this.#locate(id, options, (selector, context) =>
      context.querySelector<HTMLElement>(selector)
    );
  }

  /** 1件以上現れるまでポーリングして返す。見つからなければ TimeoutError */
  async findAll(id: SelectorId, options: LocateOptions = {}): Promise<HTMLElement[]> {
    return this.#locate(id, options, (selector, context) => {
      const elements = [...context.querySelectorAll<HTMLElement>(selector)];
      return elements.length > 0 ? elements : null;
    });
  }

  async #locate<T>(
    id: SelectorId,
    options: LocateOptions,
    query: (selector: string, context: ParentNode) => T | null
  ): Promise<T> {
    const selector = this.#selectorOf(id);
    const context = options.context ?? this.deps.root;
    try {
      const found = await waitFor(() => query(selector, context), {
        timeoutMs: options.timeoutMs ?? TIMING.elementLookupTimeoutMs,
        intervalMs: TIMING.elementPollIntervalMs,
        description: `element for selector ID "${id}"`,
      });
      await this.deps.health.recordSuccess(id);
      return found;
    } catch (error) {
      await this.deps.health.recordFailure(id, describeFailure(id, error));
      throw error;
    }
  }

  #selectorOf(id: SelectorId): string {
    if (!this.#selectors) {
      throw new Error('ElementLocator.init() must be called before locating elements');
    }
    return this.#selectors[id];
  }
}

function describeFailure(id: SelectorId, error: unknown): string {
  if (error instanceof TimeoutError) {
    return `Timeout: Could not find element for ID "${id}"`;
  }
  return error instanceof Error ? error.message : String(error);
}
