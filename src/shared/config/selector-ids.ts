import defaultSelectors from './selectors.json';

/**
 * Gemini UI 追従の単一情報源。Gemini の DOM が変わったら selectors.json を更新する。
 * ID の増減は SelectorId 型を通じて全参照箇所がコンパイル時に検査され、
 * options 画面のフォームも SELECTOR_IDS から動的生成されるため自動追従する。
 */
export const DEFAULT_SELECTORS = defaultSelectors satisfies Record<
  string,
  { selector: string }
>;

export type SelectorId = keyof typeof defaultSelectors;

export const SELECTOR_IDS = Object.keys(defaultSelectors) as readonly SelectorId[];

/** Gemini ページの操作を始める前に揃っている必要がある最小要素 */
export const REQUIRED_READY_IDS = [
  'textareaContainer',
  'sendButton',
  'modelMenuButton',
] as const satisfies readonly SelectorId[];
