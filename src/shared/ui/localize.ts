import type { I18nPort } from '../platform/i18n.js';

/**
 * HTML 内の [localize] / [localize-attr] 属性を _locales のメッセージで置換する。
 * - [localize]: 要素の textContent 内の __MSG_key__ を置換
 * - [localize-attr]="attr:__MSG_key__, ...": 指定属性へ設定
 */
export class Localizer {
  constructor(
    private readonly i18n: I18nPort,
    private readonly root: Document
  ) {}

  getMessage(key: string): string {
    return this.i18n.getMessage(key);
  }

  apply(): void {
    this.#localizeContent();
    this.#localizeAttributes();
  }

  #localizeContent(): void {
    for (const element of this.root.querySelectorAll('[localize]')) {
      const msgKey = extractMessageKey(element.textContent ?? '');
      if (msgKey) {
        element.textContent = this.getMessage(msgKey);
      }
    }
  }

  #localizeAttributes(): void {
    for (const element of this.root.querySelectorAll('[localize-attr]')) {
      const mappings = (element.getAttribute('localize-attr') ?? '').split(',');
      for (const mapping of mappings) {
        const [attrName, msgKey] = mapping.trim().split(':');
        if (!attrName || !msgKey) {
          continue;
        }
        const key = extractMessageKey(msgKey);
        if (key) {
          element.setAttribute(attrName, this.getMessage(key));
        }
      }
    }
  }
}

function extractMessageKey(text: string): string | null {
  const match = text.match(/__MSG_(\w+)__/);
  return match?.[1] ?? null;
}
