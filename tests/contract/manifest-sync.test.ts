import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GEMINI_MATCH_PATTERN } from '../../src/shared/config/urls.js';

const manifest = JSON.parse(readFileSync('public/manifest.json', 'utf8')) as {
  background: { service_worker: string; type: string };
  content_scripts: Array<{ matches: string[]; js: string[]; run_at: string }>;
  host_permissions: string[];
  web_accessible_resources?: unknown[];
  action: { default_popup: string };
  options_ui: { page: string };
};

describe('manifest.json とビルド構成の同期', () => {
  it('エントリポイントが build.mjs の出力名と一致する', () => {
    expect(manifest.background.service_worker).toBe('js/background.js');
    expect(manifest.background.type).toBe('module');
    expect(manifest.content_scripts[0]?.js).toEqual(['js/content.js']);
    expect(manifest.action.default_popup).toBe('html/popup.html');
    expect(manifest.options_ui.page).toBe('html/options.html');
  });

  it('content script は document_start で Gemini に注入される (fragment 退避の前提)', () => {
    expect(manifest.content_scripts[0]?.run_at).toBe('document_start');
    expect(manifest.content_scripts[0]?.matches).toContain(GEMINI_MATCH_PATTERN);
  });

  it('host_permissions が Gemini とリダイレクトページを含む', () => {
    expect(manifest.host_permissions).toContain(GEMINI_MATCH_PATTERN);
    expect(
      manifest.host_permissions.some((p) => p.includes('mypicto.github.io/gemini-prompt-runner'))
    ).toBe(true);
  });

  it('web_accessible_resources は空 (selectors.json はバンドル済みで実行時 fetch なし)', () => {
    expect(manifest.web_accessible_resources ?? []).toEqual([]);
  });
});
