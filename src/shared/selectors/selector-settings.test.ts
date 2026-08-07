import { describe, expect, it } from 'vitest';
import { DEFAULT_SELECTORS } from '../config/selector-ids.js';
import { MemorySelectorRepository } from './memory-selector-repository.js';
import { SelectorSettings } from './selector-settings.js';

function createSettings() {
  return new SelectorSettings(new MemorySelectorRepository());
}

describe('SelectorSettings', () => {
  it('カスタム未設定ならデフォルトセレクタを返す', async () => {
    const settings = createSettings();
    const merged = await settings.getMergedSelectors();
    expect(merged.sendButton).toBe(DEFAULT_SELECTORS.sendButton.selector);
    expect(merged.textareaContainer).toBe(DEFAULT_SELECTORS.textareaContainer.selector);
  });

  it('カスタムセレクタがデフォルトを上書きする', async () => {
    const settings = createSettings();
    await settings.updateCustomSelector('sendButton', '.custom-send');
    const merged = await settings.getMergedSelectors();
    expect(merged.sendButton).toBe('.custom-send');
    expect(merged.textareaContainer).toBe(DEFAULT_SELECTORS.textareaContainer.selector);
  });

  it('空文字のカスタムは「未設定」としてデフォルトへフォールバックする', async () => {
    const settings = createSettings();
    await settings.updateCustomSelector('sendButton', '');
    const merged = await settings.getMergedSelectors();
    expect(merged.sendButton).toBe(DEFAULT_SELECTORS.sendButton.selector);
  });

  it('updateCustomSelector は値が変わったときだけ true を返す', async () => {
    const settings = createSettings();
    expect(await settings.updateCustomSelector('sendButton', '.v1')).toBe(true);
    expect(await settings.updateCustomSelector('sendButton', '.v1')).toBe(false);
    expect(await settings.updateCustomSelector('sendButton', '.v2')).toBe(true);
  });

  it('resetToDefault はカスタムが存在したときだけ true を返す', async () => {
    const settings = createSettings();
    expect(await settings.resetToDefault('sendButton')).toBe(false);
    await settings.updateCustomSelector('sendButton', '.custom');
    expect(await settings.resetToDefault('sendButton')).toBe(true);
    expect((await settings.getMergedSelectors()).sendButton).toBe(
      DEFAULT_SELECTORS.sendButton.selector
    );
  });

  it('clearAllCustomSelectors は除去した ID 一覧を返す', async () => {
    const settings = createSettings();
    await settings.updateCustomSelector('sendButton', '.a');
    await settings.updateCustomSelector('copyButton', '.b');
    const cleared = await settings.clearAllCustomSelectors();
    expect(cleared.sort()).toEqual(['copyButton', 'sendButton']);
    expect((await settings.getMergedSelectors()).sendButton).toBe(
      DEFAULT_SELECTORS.sendButton.selector
    );
  });

  it('並行更新でも全カスタムセレクタが失われず反映される (mutex)', async () => {
    const settings = createSettings();
    await Promise.all([
      settings.updateCustomSelector('sendButton', '.a'),
      settings.updateCustomSelector('copyButton', '.b'),
      settings.updateCustomSelector('modelMenuButton', '.c'),
    ]);
    const merged = await settings.getMergedSelectors();
    expect(merged.sendButton).toBe('.a');
    expect(merged.copyButton).toBe('.b');
    expect(merged.modelMenuButton).toBe('.c');
  });
});
