import { TimeoutError } from '../shared/async/errors.js';
import { log } from '../shared/logging.js';
import type { ResponseCopyButton } from './page/response-copy-button.js';

/**
 * テキスト未選択で Cmd/Ctrl+C が押されたとき、最後の応答のコピーボタンを代わりに押す
 * (「応答全体をコピーしたい」ショートカットとして機能させる)。
 */
export class CopyShortcut {
  constructor(
    private readonly deps: {
      copyButton: ResponseCopyButton;
      document: Document;
      isMac: boolean;
    }
  ) {}

  attach(): void {
    this.deps.document.addEventListener('keydown', (event) => {
      void this.#handleKeydown(event);
    });
  }

  async #handleKeydown(event: KeyboardEvent): Promise<void> {
    const modifier = this.deps.isMac ? event.metaKey : event.ctrlKey;
    if (!modifier || event.key.toLowerCase() !== 'c' || !this.#isSelectionEmpty()) {
      return;
    }
    try {
      if (this.deps.copyButton.exists()) {
        await this.deps.copyButton.clickLatest();
      }
    } catch (error) {
      // コピーボタン不在のタイムアウトは「応答がまだ無い」だけなので無視する
      if (!(error instanceof TimeoutError)) {
        log.error('copy shortcut handling failed:', error);
      }
    }
  }

  #isSelectionEmpty(): boolean {
    const selection = this.deps.document.getSelection();
    return !selection || selection.toString().trim().length === 0;
  }
}
