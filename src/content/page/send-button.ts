import type { ElementLocator } from './element-locator.js';

/** Gemini の送信ボタン。応答中は同じボタンが stop ボタンに変わる仕様を吸収する */
export class SendButton {
  constructor(private readonly locator: ElementLocator) {}

  async submit(): Promise<void> {
    const button = await this.locator.find('sendButton');
    button.click();
  }

  /** 応答ストリーミング中か (ボタンが stop 状態か) */
  async isAnswering(): Promise<boolean> {
    const button = await this.locator.find('sendButton');
    return button.classList.contains('stop');
  }
}
