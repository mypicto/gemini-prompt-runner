import { describe, expect, it } from 'vitest';
import { MemorySelectorRepository } from './memory-selector-repository.js';
import { SelectorHealth } from './selector-health.js';

function createHealth() {
  return new SelectorHealth(new MemorySelectorRepository());
}

describe('SelectorHealth', () => {
  it('未記録の ID は初期形状を返す', async () => {
    const health = createHealth();
    expect(await health.get('sendButton')).toEqual({
      lastSuccessTime: null,
      hasError: false,
      errorMessage: '',
    });
  });

  it('成功記録で lastSuccessTime が入りエラーが消える', async () => {
    const health = createHealth();
    await health.recordFailure('sendButton', 'broken');
    await health.recordSuccess('sendButton');
    const status = await health.get('sendButton');
    expect(status.lastSuccessTime).not.toBeNull();
    expect(status.hasError).toBe(false);
    expect(status.errorMessage).toBe('');
  });

  it('失敗記録は直前の成功時刻を保持したままエラーを立てる', async () => {
    const health = createHealth();
    await health.recordSuccess('sendButton');
    const success = await health.get('sendButton');
    await health.recordFailure('sendButton', 'not found');
    const status = await health.get('sendButton');
    expect(status.hasError).toBe(true);
    expect(status.errorMessage).toBe('not found');
    expect(status.lastSuccessTime).toBe(success.lastSuccessTime);
  });

  it('reset で初期状態に戻る', async () => {
    const health = createHealth();
    await health.recordFailure('sendButton', 'broken');
    await health.reset('sendButton');
    expect(await health.get('sendButton')).toEqual({
      lastSuccessTime: null,
      hasError: false,
      errorMessage: '',
    });
  });

  it('resetMany は指定 ID をまとめて初期化する', async () => {
    const health = createHealth();
    await health.recordFailure('a', 'x');
    await health.recordFailure('b', 'y');
    await health.resetMany(['a', 'b']);
    expect((await health.get('a')).hasError).toBe(false);
    expect((await health.get('b')).hasError).toBe(false);
  });
});
