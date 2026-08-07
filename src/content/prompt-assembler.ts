import { CLIPBOARD_KEYWORD } from '../shared/config/ext-params.js';
import type { QueryParameter } from '../shared/core/query-parameter.js';
import type { ClipboardPort } from '../shared/platform/clipboard.js';

/**
 * QueryParameter が持つ生のプロンプトを、実際に投入するテキストへ加工する:
 * {{clipboard}} プレースホルダの置換と、改行コードの LF 正規化 (Gemini の <p> 分割前提)。
 */
export class PromptAssembler {
  constructor(private readonly clipboard: ClipboardPort) {}

  async assemble(parameter: QueryParameter): Promise<string[]> {
    if (!parameter.prompts) {
      return [];
    }
    const useClipboard = parameter.isUseClipboard === true;
    return Promise.all(
      parameter.prompts.map((prompt) => this.#assembleOne(prompt, useClipboard))
    );
  }

  async #assembleOne(prompt: string, useClipboard: boolean): Promise<string> {
    let text = prompt;
    if (useClipboard && text.includes(CLIPBOARD_KEYWORD)) {
      text = text.replaceAll(CLIPBOARD_KEYWORD, await this.#readClipboardSafely());
    }
    return text.replace(/\r\n|\r/g, '\n');
  }

  /** クリップボードの読み取り拒否 (権限なし等) は空文字での置換にフォールバックする */
  async #readClipboardSafely(): Promise<string> {
    try {
      return (await this.clipboard.read()) || '';
    } catch {
      return '';
    }
  }
}
