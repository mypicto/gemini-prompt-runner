import { describe, expect, it } from 'vitest';
import { PendingParameters } from './pending-parameters.js';

describe('PendingParameters', () => {
  it('ext-* を含む URL を捕捉し、take で払い出す', () => {
    const pending = new PendingParameters();
    pending.capture('https://gemini.google.com/app?ext-q=hello&ext-send=1');
    const dto = pending.take();
    expect(dto.prompts).toEqual(['hello']);
    expect(dto.send).toBe(true);
    expect(dto.queryParameterDetected).toBe(true);
  });

  it('take すると空に戻る (二重実行防止の一度きりの受け渡し)', () => {
    const pending = new PendingParameters();
    pending.capture('https://gemini.google.com/app?ext-q=hello');
    pending.take();
    expect(pending.take().prompts).toBeNull();
  });

  it('ext-* を含まない URL は捕捉済みパラメータを上書きしない', () => {
    const pending = new PendingParameters();
    pending.capture('https://gemini.google.com/app?ext-q=hello');
    pending.capture('https://gemini.google.com/app'); // リダイレクト後の浄化済み URL 等
    expect(pending.take().prompts).toEqual(['hello']);
  });
});
