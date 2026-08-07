import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ALL_EXT_PARAMS } from '../../src/shared/config/ext-params.js';

// docs/ (GitHub Pages のリダイレクトページ) は素の JS のまま維持するため、
// 拡張側の単一情報源とのズレをテキスト解析で検証する。

const pollerSource = readFileSync('docs/js/extension-ready-poller.js', 'utf8');

describe('docs/js/extension-ready-poller.js との同期', () => {
  it('PARAM_KEYS が ALL_EXT_PARAMS と集合一致する', () => {
    const match = pollerSource.match(/const PARAM_KEYS = \[([^\]]*)\]/);
    expect(match).not.toBeNull();
    const keys = [...(match?.[1] ?? '').matchAll(/'([^']+)'/g)].map((m) => m[1]);
    expect([...keys].sort()).toEqual([...ALL_EXT_PARAMS].sort());
  });

  it('PING/ALIVE の wire 形式に依存している (external-ping.ts で凍結)', () => {
    expect(pollerSource).toContain("{ type: 'PING' }");
    expect(pollerSource).toContain("resp.status === 'ALIVE'");
  });
});
