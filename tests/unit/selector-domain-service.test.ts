import { describe, it, expect, beforeEach } from 'vitest';
import { SelectorDomainService } from '../../extension/js/services/selector-domain-service.js';
import { MemorySelectorRepository } from '../src/stubs/memory-selector-repository.js';

const DEFAULTS = {
  textareaContainer: { selector: '.default-textarea' },
  sendButton: { selector: '.default-send' },
};

// 本体が未型付け JS のため戻り値が {} に推論される。Phase 3 の TS 化で不要になる
type SelectorMap = Record<string, { selector: string }>;
const merged = async (service: { getMergedSelectors(): Promise<unknown> }) =>
  (await service.getMergedSelectors()) as SelectorMap;

function createService() {
  return new SelectorDomainService({
    repository: new MemorySelectorRepository(),
    defaultSelectorsLoader: async () => DEFAULTS,
  });
}

describe('SelectorDomainService: デフォルトとカスタムのマージ', () => {
  let service: ReturnType<typeof createService>;

  beforeEach(async () => {
    service = createService();
    await service.init();
  });

  it('カスタム未設定ならデフォルトを返す', async () => {
    expect(await merged(service)).toEqual(DEFAULTS);
  });

  it('カスタムセレクタがデフォルトを上書きする', async () => {
    await service.updateCustomSelector('sendButton', '.custom-send');
    const map = await merged(service);
    expect(map.sendButton).toEqual({ selector: '.custom-send' });
    expect(map.textareaContainer).toEqual({ selector: '.default-textarea' });
  });

  it('空文字のカスタムはマージ時に無視される', async () => {
    await service.updateCustomSelector('sendButton', '');
    const map = await merged(service);
    expect(map.sendButton).toEqual({ selector: '.default-send' });
  });

  it('resetToDefault でカスタムが除去される', async () => {
    await service.updateCustomSelector('sendButton', '.custom-send');
    await service.resetToDefault('sendButton');
    const map = await merged(service);
    expect(map.sendButton).toEqual({ selector: '.default-send' });
  });

  it('getDefaultSelector は未知 ID に空文字を返す', () => {
    expect(service.getDefaultSelector('sendButton')).toBe('.default-send');
    expect(service.getDefaultSelector('unknown')).toBe('');
  });
});

describe('SelectorDomainService: セレクタステータス', () => {
  let service: ReturnType<typeof createService>;

  beforeEach(async () => {
    service = createService();
    await service.init();
  });

  it('未記録の ID は初期形状を返す', async () => {
    expect(await service.getSelectorStatus('sendButton')).toEqual({
      lastSuccessTime: null,
      hasError: false,
      errorMessage: '',
    });
  });

  it('成功記録で lastSuccessTime が入りエラーが消える', async () => {
    await service.updateSelectorStatus('sendButton', false, 'broken');
    await service.updateSelectorStatus('sendButton', true);
    const status = await service.getSelectorStatus('sendButton');
    expect(status.lastSuccessTime).not.toBeNull();
    expect(status.hasError).toBe(false);
    expect(status.errorMessage).toBe('');
  });

  it('失敗記録は直前の成功時刻を保持したままエラーを立てる', async () => {
    await service.updateSelectorStatus('sendButton', true);
    const success = await service.getSelectorStatus('sendButton');
    await service.updateSelectorStatus('sendButton', false, 'not found');
    const status = await service.getSelectorStatus('sendButton');
    expect(status.hasError).toBe(true);
    expect(status.errorMessage).toBe('not found');
    expect(status.lastSuccessTime).toBe(success.lastSuccessTime);
  });

  it('カスタムセレクタの値が変わった時のみステータスをリセットする', async () => {
    await service.updateCustomSelector('sendButton', '.v1');
    await service.updateSelectorStatus('sendButton', false, 'broken');

    await service.updateCustomSelector('sendButton', '.v1'); // 同値 → リセットしない
    expect((await service.getSelectorStatus('sendButton')).hasError).toBe(true);

    await service.updateCustomSelector('sendButton', '.v2'); // 変更 → リセット
    expect(await service.getSelectorStatus('sendButton')).toEqual({
      lastSuccessTime: null,
      hasError: false,
      errorMessage: '',
    });
  });

  it('clearAllCustomSelectors はカスタムを全消しし該当ステータスをリセットする', async () => {
    await service.updateCustomSelector('sendButton', '.custom');
    await service.updateSelectorStatus('sendButton', false, 'broken');
    await service.clearAllCustomSelectors();
    expect(await merged(service)).toEqual(DEFAULTS);
    expect((await service.getSelectorStatus('sendButton')).hasError).toBe(false);
  });
});

describe('SelectorDomainService: 排他制御', () => {
  it('並行更新でも全カスタムセレクタが失われず反映される', async () => {
    const service = createService();
    await service.init();
    await Promise.all([
      service.updateCustomSelector('a', '.a'),
      service.updateCustomSelector('b', '.b'),
      service.updateCustomSelector('c', '.c'),
    ]);
    const map = await merged(service);
    expect(map.a).toEqual({ selector: '.a' });
    expect(map.b).toEqual({ selector: '.b' });
    expect(map.c).toEqual({ selector: '.c' });
  });
});
