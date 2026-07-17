import type { ElementLocator } from './element-locator.js';

/**
 * Gemini のリッチテキスト入力欄。行ごとの <p> 要素として保持される構造を吸収し、
 * プレーンテキスト (LF 区切り) との相互変換とカーソル操作を提供する。
 */
export class PromptTextarea {
  constructor(
    private readonly deps: {
      locator: ElementLocator;
      document: Document;
    }
  ) {}

  async setPrompt(prompt: string): Promise<void> {
    const container = await this.#container();
    container.replaceChildren();
    for (const line of prompt.split('\n')) {
      container.appendChild(this.#createParagraph(line));
    }
    this.#moveCursorToEnd(container);
  }

  async getPrompt(): Promise<string> {
    const container = await this.#container();
    const lines = [...container.getElementsByTagName('p')].map((p) =>
      this.#extractLine(p)
    );
    return lines.join('\n');
  }

  /**
   * カーソルが入力欄内にあればその位置へ、なければ末尾へテキストを挿入する
   * (popup の「クリップボード挿入」ボタン用)。
   */
  async insertTextAtCursor(text: string): Promise<void> {
    if (await this.#isCursorInContainer()) {
      this.#insertAtSelection(text);
    } else {
      await this.#appendToEnd(text);
    }
  }

  async #container(): Promise<HTMLElement> {
    return this.deps.locator.find('textareaContainer');
  }

  #createParagraph(line: string): HTMLParagraphElement {
    const p = this.deps.document.createElement('p');
    if (line === '') {
      // 空行は <p><br></p> にしないと Gemini 側で行として認識されない
      p.appendChild(this.deps.document.createElement('br'));
    } else {
      p.textContent = line;
    }
    return p;
  }

  #extractLine(p: HTMLParagraphElement): string {
    if (p.children.length === 1 && p.children[0]?.tagName === 'BR') {
      return '';
    }
    return p.textContent ?? '';
  }

  async #isCursorInContainer(): Promise<boolean> {
    const container = await this.#container();
    const selection = this.deps.document.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      return container.contains(range.commonAncestorContainer);
    }
    return false;
  }

  #insertAtSelection(text: string): void {
    const selection = this.deps.document.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const textNode = this.deps.document.createTextNode(text);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.collapse(true);
    this.#applySelection(range);
  }

  async #appendToEnd(text: string): Promise<void> {
    const container = await this.#container();
    const paragraphs = container.getElementsByTagName('p');
    const last = paragraphs.length > 0 ? paragraphs[paragraphs.length - 1] : null;
    if (last) {
      last.textContent = this.#extractLine(last) + text;
    } else {
      container.appendChild(this.#createParagraph(text));
    }
    this.#moveCursorToEnd(container);
  }

  #moveCursorToEnd(container: HTMLElement): void {
    container.focus();
    const range = this.deps.document.createRange();
    range.selectNodeContents(container);
    range.collapse(false);
    this.#applySelection(range);
  }

  #applySelection(range: Range): void {
    const selection = this.deps.document.getSelection();
    if (!selection) {
      return;
    }
    selection.removeAllRanges();
    selection.addRange(range);
  }
}
