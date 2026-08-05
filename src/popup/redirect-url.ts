import { log } from '../shared/logging.js';

/**
 * Gemini の共有 URL を GitHub Pages のリダイレクトページ経由の URL に変換する。
 * path とフラグメントを維持したまま origin だけ差し替える。
 * パースできない URL は変換せずそのまま返す (旧実装踏襲)。
 */
export function toRedirectUrl(originalUrl: string, baseUrl: string): string {
  try {
    const url = new URL(originalUrl);
    return `${baseUrl}${url.pathname}${url.hash}`;
  } catch (error) {
    log.error('Failed to convert URL:', error);
    return originalUrl;
  }
}
