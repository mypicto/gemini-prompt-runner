import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RetryService } from '../../extension/js/services/retry-service.js';

describe('RetryService.retryUntilSuccess', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('条件が最初から真なら即座に結果を返す', async () => {
    const service = new RetryService();
    await expect(service.retryUntilSuccess(() => 'ok', 1000, 100)).resolves.toBe('ok');
  });

  it('偽の間はポーリングし、真になったら値を返す', async () => {
    const service = new RetryService();
    let calls = 0;
    const condition = () => (++calls >= 3 ? 'found' : null);
    const promise = service.retryUntilSuccess(condition, 1000, 100);
    await vi.advanceTimersByTimeAsync(300);
    await expect(promise).resolves.toBe('found');
    expect(calls).toBe(3);
  });

  it('タイムアウトまで真にならなければ Timeout エラーを投げる', async () => {
    const service = new RetryService();
    const promise = service.retryUntilSuccess(() => null, 300, 100);
    const assertion = expect(promise).rejects.toThrow(/^Timeout/);
    await vi.advanceTimersByTimeAsync(500);
    await assertion;
  });
});
