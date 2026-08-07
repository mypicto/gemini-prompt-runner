import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  ALL_EXT_PARAMS,
  LEGACY_REMOVED_PARAMS,
} from '../../src/shared/config/ext-params.js';
import { GEMINI_MATCH_PATTERN, GEMINI_ORIGIN, REDIRECT_BASE_URL } from '../../src/shared/config/urls.js';

// public/rules.json (declarativeNetRequest) は静的 JSON のため、
// src/shared/config の単一情報源とズレていないことをここで検証する。

interface DnrRule {
  id: number;
  action: {
    redirect?: {
      transform?: { queryTransform?: { removeParams?: string[] } };
      regexSubstitution?: string;
    };
  };
  condition: { urlFilter?: string; regexFilter?: string };
}

const rules = JSON.parse(readFileSync('public/rules.json', 'utf8')) as DnrRule[];

describe('rules.json と ext-params/urls の同期', () => {
  it('rule 1 の removeParams が EXT_PARAMS + legacy と集合一致する', () => {
    const rule = rules.find((r) => r.id === 1);
    const removeParams = rule?.action.redirect?.transform?.queryTransform?.removeParams ?? [];
    expect([...removeParams].sort()).toEqual(
      [...ALL_EXT_PARAMS, ...LEGACY_REMOVED_PARAMS].sort()
    );
  });

  it('rule 1 は Gemini のメインフレームを対象にしている', () => {
    const rule = rules.find((r) => r.id === 1);
    expect(rule?.condition.urlFilter).toBe(GEMINI_MATCH_PATTERN);
  });

  it('rule 2 は REDIRECT_BASE_URL から Gemini へのリダイレクト', () => {
    const rule = rules.find((r) => r.id === 2);
    const unescaped = (rule?.condition.regexFilter ?? '').replace(/\\/g, '');
    expect(unescaped).toBe(`^${REDIRECT_BASE_URL}(.*)`);
    expect(rule?.action.redirect?.regexSubstitution).toBe(`${GEMINI_ORIGIN}\\1`);
  });
});
