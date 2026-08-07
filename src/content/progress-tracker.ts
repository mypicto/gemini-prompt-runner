import type { IconReporting } from './icon-reporter.js';

/**
 * 実行フローの進捗を数えてツールバーアイコンに反映する。
 * suppressed (クエリ形式検出で警告表示中) のときは何も送らず、警告アイコンを維持する。
 */
export class ProgressTracker {
  #count = 0;

  private constructor(
    private readonly reporter: IconReporting,
    private readonly maxCount: number,
    private readonly suppressed: boolean
  ) {}

  static forPrompts(
    reporter: IconReporting,
    promptCount: number,
    suppressed: boolean
  ): ProgressTracker {
    // 進捗の内訳: モデル選択で 1、プロンプトごとに投入 + 応答完了で 2
    return new ProgressTracker(reporter, 1 + promptCount * 2, suppressed);
  }

  reportInitial(): void {
    this.#report();
  }

  increment(): void {
    this.#count = Math.min(this.#count + 1, this.maxCount);
    this.#report();
  }

  #report(): void {
    if (this.suppressed) {
      return;
    }
    const percent = this.maxCount === 0 ? 0 : (this.#count / this.maxCount) * 100;
    this.reporter.report({ kind: 'progress', percent });
  }
}
