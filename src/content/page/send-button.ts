import { TimeoutError } from '../../shared/async/errors.js';
import type { ElementLocator } from './element-locator.js';

/**
 * Gemini の送信ボタン。応答中は同じボタンが stop ボタンに変わり、
 * テキストエリアが空の間はボタン自体が DOM に存在しない仕様を吸収する。
 */
export class SendButton {
  constructor(private readonly locator: ElementLocator) {}

  async submit(): Promise<void> {
    const button = await this.locator.find('sendButton');
    button.click();
  }

  /** 応答ストリーミング中か (ボタンが stop 状態か)。ボタン不在 = 非応答中 */
  async isAnswering(): Promise<boolean> {
    if (!this.locator.exists('sendButton')) {
      return false; // 応答完了後は入力欄が空になりボタンごと消える
    }
    try {
      const button = await this.locator.find('sendButton');
      return button.classList.contains('stop');
    } catch (error) {
      if (error instanceof TimeoutError) {
        return false; // exists 直後に消えたレース = 非応答中
      }
      throw error;
    }
  }
}
