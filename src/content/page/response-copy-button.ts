import type { ElementLocator } from './element-locator.js';

/** 各応答に付くコピー用ボタン。「最後の応答」= 最後尾の要素という Gemini の DOM 構造に依存する */
export class ResponseCopyButton {
  constructor(private readonly locator: ElementLocator) {}

  exists(): boolean {
    return this.locator.exists('copyButton');
  }

  async clickLatest(): Promise<void> {
    // exists() 確認後に呼ばれる想定のためリトライ待機はしない (timeoutMs: 0)
    const buttons = await this.locator.findAll('copyButton', { timeoutMs: 0 });
    buttons[buttons.length - 1]?.click();
  }
}
