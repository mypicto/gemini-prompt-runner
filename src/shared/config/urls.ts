/**
 * ホスト・URL の単一情報源。
 * public/manifest.json / public/rules.json / docs のリダイレクトページにも現れるが、
 * それらとの同期は tests/contract/ の契約テストで検証する。
 */
export const GEMINI_ORIGIN = 'https://gemini.google.com';
export const GEMINI_HOST = 'gemini.google.com';
export const GEMINI_MATCH_PATTERN = '*://gemini.google.com/*';
export const GEMINI_APP_PATH = '/app';

/** 共有 URL のリダイレクト用 GitHub Pages (rules.json が Gemini へ転送する) */
export const REDIRECT_BASE_URL = 'https://mypicto.github.io/gemini-prompt-runner';

/** Gem ページではモデル切替 UI が存在しないため、この path セグメントで判定する */
export const GEM_PAGE_SEGMENT = '/gem/';
