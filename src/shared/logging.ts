/**
 * console 直書きの代わりに使う共通ロガー。
 * どのコンテキスト (background / content / popup / options) のログか
 * DevTools 上で判別できるよう接頭辞を付ける。
 */
const PREFIX = '[Gemini Prompt Runner]';

export const log = {
  debug: (...args: unknown[]): void => console.debug(PREFIX, ...args),
  warn: (...args: unknown[]): void => console.warn(PREFIX, ...args),
  error: (...args: unknown[]): void => console.error(PREFIX, ...args),
};
