import { describe, it, expect, vi, afterEach } from 'vitest';
import { QueryParameter } from '../../src/utils/query-parameter.js';
import {
  IdentifierModelQuery,
  NominalModelQuery,
  FallbackModelQuery,
} from '../../src/models/model-query.js';

// 現行挙動の固定 (characterization)。仕様変更時はテストを先に更新してから実装を変える。

// 本体が未型付け JS のため、デフォルト値 null からの推論を上書きするヘルパ (Phase 3 の TS 化で不要になる)
interface GenerateOptions {
  prompts?: string[] | null;
  isAutoSend?: boolean | null;
  isUseClipboard?: boolean | null;
  isRequiredLogin?: boolean | null;
}
const generate = (options: GenerateOptions) => QueryParameter.generate(options as never);

describe('QueryParameter.generateFromUrl', () => {
  it('フラグメント形式 (#ext-q=...) からプロンプトとフラグを読み取る', () => {
    const p = QueryParameter.generateFromUrl(
      new URL('https://gemini.google.com/app#ext-q=hello&ext-send=1')
    );
    expect(p.prompts).toEqual(['hello']);
    expect(p.isAutoSend()).toBe(true);
    // フラグメント経路はサーバに漏れないため「検出」扱いにならない
    expect(p.isQueryParameterDetected()).toBe(false);
  });

  it('クエリ形式 (?ext-q=...) は isQueryParameterDetected を立てる', () => {
    const p = QueryParameter.generateFromUrl(
      new URL('https://gemini.google.com/app?ext-q=hello')
    );
    expect(p.prompts).toEqual(['hello']);
    expect(p.isQueryParameterDetected()).toBe(true);
  });

  it('複数の ext-q はクエリ→フラグメントの順に連結される', () => {
    const p = QueryParameter.generateFromUrl(
      new URL('https://gemini.google.com/app?ext-q=a&ext-q=b#ext-q=c')
    );
    expect(p.prompts).toEqual(['a', 'b', 'c']);
  });

  it('ext-q がない場合 prompts は空配列', () => {
    const p = QueryParameter.generateFromUrl(
      new URL('https://gemini.google.com/app#ext-m=Flash')
    );
    expect(p.prompts).toEqual([]);
  });

  it('ext-m が整数なら IdentifierModelQuery', () => {
    const p = QueryParameter.generateFromUrl(
      new URL('https://gemini.google.com/app#ext-m=2')
    );
    expect(p.getModelQuery()).toBeInstanceOf(IdentifierModelQuery);
    expect(p.getModelQuery().getIdentifierString()).toBe('2');
  });

  it('ext-m が単一名なら NominalModelQuery (正規化済み識別子)', () => {
    const p = QueryParameter.generateFromUrl(
      new URL('https://gemini.google.com/app#ext-m=3.5%20Flash')
    );
    expect(p.getModelQuery()).toBeInstanceOf(NominalModelQuery);
    expect(p.getModelQuery().getIdentifierString()).toBe('3.5flash');
  });

  it('ext-m がカンマ区切りなら FallbackModelQuery (候補順を保持)', () => {
    const p = QueryParameter.generateFromUrl(
      new URL('https://gemini.google.com/app#ext-m=Flash,%20Pro')
    );
    expect(p.getModelQuery()).toBeInstanceOf(FallbackModelQuery);
    expect(p.getModelQuery().getIdentifierString()).toBe('flash,pro');
  });

  it('ext-m が空/空白のみなら modelQuery は null', () => {
    const empty = QueryParameter.generateFromUrl(
      new URL('https://gemini.google.com/app#ext-m=')
    );
    expect(empty.getModelQuery()).toBeNull();
    const blanks = QueryParameter.generateFromUrl(
      new URL('https://gemini.google.com/app#ext-m=%20,%20')
    );
    expect(blanks.getModelQuery()).toBeNull();
  });

  it('ext-m はクエリがフラグメントより優先される', () => {
    const p = QueryParameter.generateFromUrl(
      new URL('https://gemini.google.com/app?ext-m=QueryModel#ext-m=FragmentModel')
    );
    expect(p.getModelQuery().getIdentifierString()).toBe('querymodel');
  });

  it('ext-send は "1"/"true" のみ真', () => {
    const yes1 = QueryParameter.generateFromUrl(new URL('https://g/#ext-send=1'));
    const yesTrue = QueryParameter.generateFromUrl(new URL('https://g/#ext-send=true'));
    const no0 = QueryParameter.generateFromUrl(new URL('https://g/#ext-send=0'));
    const absent = QueryParameter.generateFromUrl(new URL('https://g/'));
    expect(yes1.isAutoSend()).toBe(true);
    expect(yesTrue.isAutoSend()).toBe(true);
    expect(no0.isAutoSend()).toBe(false);
    expect(absent.isAutoSend()).toBe(false);
  });

  it('ext-required-login は未指定なら null、指定時は boolean', () => {
    const absent = QueryParameter.generateFromUrl(new URL('https://g/'));
    const yes = QueryParameter.generateFromUrl(new URL('https://g/#ext-required-login=1'));
    const no = QueryParameter.generateFromUrl(new URL('https://g/#ext-required-login=0'));
    expect(absent.isRequiredLogin()).toBeNull();
    expect(yes.isRequiredLogin()).toBe(true);
    expect(no.isRequiredLogin()).toBe(false);
  });
});

describe('QueryParameter.hasTargetParametersInUrl / removeQueryAndFragment', () => {
  it('ext-* がクエリまたはフラグメントにあれば検出する', () => {
    expect(
      QueryParameter.hasTargetParametersInUrl(new URL('https://g/app#ext-q=x'))
    ).toBe(true);
    expect(
      QueryParameter.hasTargetParametersInUrl(new URL('https://g/app?ext-m=y'))
    ).toBe(true);
    expect(
      QueryParameter.hasTargetParametersInUrl(new URL('https://g/app?foo=bar#baz=1'))
    ).toBe(false);
  });

  it('removeQueryAndFragment は ext-* クエリのみ除去し、フラグメントは全消去する', () => {
    const url = new URL('https://g/app?foo=bar&ext-q=x&ext-send=1#ext-m=y');
    const sanitized = QueryParameter.removeQueryAndFragment(url);
    expect(sanitized.searchParams.get('foo')).toBe('bar');
    expect(sanitized.searchParams.has('ext-q')).toBe(false);
    expect(sanitized.searchParams.has('ext-send')).toBe(false);
    expect(sanitized.hash).toBe('');
  });
});

describe('QueryParameter.buildUrl', () => {
  const location = { origin: 'https://gemini.google.com', pathname: '/app' };

  it('必ずフラグメント形式で出力する (クエリには載せない)', () => {
    const p = QueryParameter.generateFromUrl(
      new URL('https://gemini.google.com/app#ext-q=hello&ext-m=Flash&ext-send=1')
    );
    const url = new URL(p.buildUrl(location));
    expect(url.search).toBe('');
    const fragment = new URLSearchParams(url.hash.substring(1));
    expect(fragment.get('ext-q')).toBe('hello');
    expect(fragment.get('ext-m')).toBe('flash');
    expect(fragment.get('ext-send')).toBe('1');
  });

  it('パラメータが何もなければフラグメントを付けない', () => {
    const p = generate({});
    expect(p.buildUrl(location)).toBe('https://gemini.google.com/app');
  });

  it('{{clipboard}} を含むプロンプトには ext-clipboard=1 を付与する', () => {
    const p = generate({ prompts: ['use {{clipboard}} here'] });
    const fragment = new URLSearchParams(new URL(p.buildUrl(location)).hash.substring(1));
    expect(fragment.get('ext-clipboard')).toBe('1');
  });

  it('isUseClipboard === false なら {{clipboard}} があっても ext-clipboard を付けない', () => {
    const p = generate({
      prompts: ['use {{clipboard}} here'],
      isUseClipboard: false,
    });
    const fragment = new URLSearchParams(new URL(p.buildUrl(location)).hash.substring(1));
    expect(fragment.has('ext-clipboard')).toBe(false);
  });

  it('requiredLogin は true/false 双方をシリアライズし、null は省略する', () => {
    const yes = generate({ isRequiredLogin: true });
    const no = generate({ isRequiredLogin: false });
    const absent = generate({});
    expect(new URL(yes.buildUrl(location)).hash).toContain('ext-required-login=1');
    expect(new URL(no.buildUrl(location)).hash).toContain('ext-required-login=0');
    expect(absent.buildUrl(location)).not.toContain('ext-required-login');
  });

  it('buildUrl → generateFromUrl のラウンドトリップで内容が保存される', () => {
    const original = QueryParameter.generateFromUrl(
      new URL(
        'https://gemini.google.com/app#ext-q=line1&ext-q=line2&ext-m=Flash,Pro&ext-send=1&ext-required-login=1'
      )
    );
    const reparsed = QueryParameter.generateFromUrl(new URL(original.buildUrl(location)));
    expect(reparsed.prompts).toEqual(['line1', 'line2']);
    expect(reparsed.getModelQuery().getIdentifierString()).toBe('flash,pro');
    expect(reparsed.isAutoSend()).toBe(true);
    expect(reparsed.isRequiredLogin()).toBe(true);
  });
});

describe('QueryParameter toJSON / generateFromJson', () => {
  it('シリアライズ往復で内容が保存される', () => {
    const original = QueryParameter.generateFromUrl(
      new URL('https://g/app?ext-q=hi&ext-m=2&ext-send=1&ext-required-login=0')
    );
    const restored = QueryParameter.generateFromJson(
      JSON.parse(JSON.stringify(original.toJSON()))
    );
    expect(restored.prompts).toEqual(['hi']);
    expect(restored.getModelQuery()).toBeInstanceOf(IdentifierModelQuery);
    expect(restored.getModelQuery().getIdentifierString()).toBe('2');
    expect(restored.isAutoSend()).toBe(true);
    expect(restored.isRequiredLogin()).toBe(false);
    // クエリ検出フラグも wire を通って保存される
    expect(restored.isQueryParameterDetected()).toBe(true);
  });
});

describe('QueryParameter.buildPromptTexts', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('CRLF/CR を LF に正規化する', async () => {
    const p = generate({ prompts: ['a\r\nb\rc'] });
    expect(await p.buildPromptTexts()).toEqual(['a\nb\nc']);
  });

  it('isUseClipboard 時に {{clipboard}} をクリップボード内容へ置換する', async () => {
    vi.stubGlobal('navigator', {
      clipboard: { readText: async () => 'CLIP' },
    });
    const p = generate({
      prompts: ['before {{clipboard}} after'],
      isUseClipboard: true,
    });
    expect(await p.buildPromptTexts()).toEqual(['before CLIP after']);
  });

  it('isUseClipboard でなければ {{clipboard}} をそのまま残す', async () => {
    const p = generate({ prompts: ['keep {{clipboard}}'] });
    expect(await p.buildPromptTexts()).toEqual(['keep {{clipboard}}']);
  });

  it('クリップボード読み取り失敗時は空文字で置換する', async () => {
    vi.stubGlobal('navigator', {
      clipboard: {
        readText: async () => {
          throw new Error('denied');
        },
      },
    });
    const p = generate({
      prompts: ['x{{clipboard}}y'],
      isUseClipboard: true,
    });
    expect(await p.buildPromptTexts()).toEqual(['xy']);
  });
});

describe('QueryParameter コンストラクタ保護', () => {
  it('ファクトリメソッド以外からの直接 new は拒否される', () => {
    expect(() => new (QueryParameter as unknown as new (arg: object) => unknown)({})).toThrow(
      /factory/
    );
  });
});
