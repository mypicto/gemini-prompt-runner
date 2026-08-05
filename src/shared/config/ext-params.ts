/**
 * URL パラメータ名の単一情報源。
 * public/rules.json (declarativeNetRequest) と docs/js/extension-ready-poller.js にも
 * 同じ名前が現れるが、それらとの同期は tests/contract/ の契約テストで検証する。
 */
export const EXT_PARAMS = {
  prompt: 'ext-q',
  model: 'ext-m',
  send: 'ext-send',
  clipboard: 'ext-clipboard',
  requiredLogin: 'ext-required-login',
} as const;

export type ExtParamName = (typeof EXT_PARAMS)[keyof typeof EXT_PARAMS];

export const ALL_EXT_PARAMS = Object.values(EXT_PARAMS) as readonly ExtParamName[];

/**
 * 過去のバージョンにのみ存在したパラメータ。
 * 古い共有 URL を浄化し続けるため rules.json の removeParams には残す。
 */
export const LEGACY_REMOVED_PARAMS = ['ext-confirm'] as const;

/** プロンプト内でクリップボード内容に置換されるプレースホルダ */
export const CLIPBOARD_KEYWORD = '{{clipboard}}';
