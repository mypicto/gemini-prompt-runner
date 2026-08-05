import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TimeoutError } from './errors.js';
import { waitFor, waitForQuiet } from './wait-for.js';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('waitFor', () => {
  it('条件が最初から truthy なら即座に値を返す', async () => {
    await expect(waitFor(() => 'ok', { timeoutMs: 1000, intervalMs: 100 })).resolves.toBe('ok');
  });

  it('falsy の間はポーリングし、truthy になったら値を返す', async () => {
    let calls = 0;
    const promise = waitFor(() => (++calls >= 3 ? 'found' : null), {
      timeoutMs: 1000,
      intervalMs: 100,
    });
    await vi.advanceTimersByTimeAsync(300);
    await expect(promise).resolves.toBe('found');
    expect(calls).toBe(3);
  });

  it('タイムアウトまで truthy にならなければ TimeoutError を投げる', async () => {
    const promise = waitFor(() => null, {
      timeoutMs: 300,
      intervalMs: 100,
      description: 'test condition',
    });
    const assertion = expect(promise).rejects.toThrow(TimeoutError);
    await vi.advanceTimersByTimeAsync(500);
    await assertion;
  });
});

describe('waitForQuiet', () => {
  it('条件成立で true を返す', async () => {
    await expect(waitForQuiet(() => true, { timeoutMs: 1000, intervalMs: 100 })).resolves.toBe(
      true
    );
  });

  it('タイムアウトしても throw せず false を返す (フェイルオープン)', async () => {
    const promise = waitForQuiet(() => false, { timeoutMs: 300, intervalMs: 100 });
    await vi.advanceTimersByTimeAsync(500);
    await expect(promise).resolves.toBe(false);
  });

  it('probe の例外は false 扱いで継続する', async () => {
    let calls = 0;
    const promise = waitForQuiet(
      () => {
        if (++calls < 3) {
          throw new Error('not ready');
        }
        return true;
      },
      { timeoutMs: 1000, intervalMs: 100 }
    );
    await vi.advanceTimersByTimeAsync(300);
    await expect(promise).resolves.toBe(true);
  });

  it('非同期 probe (Promise<boolean>) も扱える', async () => {
    let calls = 0;
    const promise = waitForQuiet(async () => ++calls >= 2, { timeoutMs: 1000, intervalMs: 100 });
    await vi.advanceTimersByTimeAsync(200);
    await expect(promise).resolves.toBe(true);
  });
});
