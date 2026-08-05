import { describe, expect, it, vi } from 'vitest';
import { registerExternalPing } from './external-ping.js';

// wire 形式 {type:'PING'} → {status:'ALIVE', version} は
// docs/js/extension-ready-poller.js が依存する公開契約。変更禁止。

function createFakeRuntime() {
  let listener:
    | ((request: unknown, sender: unknown, sendResponse: (response: unknown) => void) => unknown)
    | undefined;
  return {
    runtime: {
      onMessageExternal: {
        addListener: (fn: NonNullable<typeof listener>) => {
          listener = fn;
        },
      },
    } as unknown as Pick<typeof chrome.runtime, 'onMessageExternal'>,
    ping: (request: unknown) => {
      const sendResponse = vi.fn();
      listener?.(request, {}, sendResponse);
      return sendResponse;
    },
  };
}

describe('registerExternalPing', () => {
  it('PING に {status:ALIVE, version} で応答する', () => {
    const fake = createFakeRuntime();
    registerExternalPing(fake.runtime, {
      name: 'test',
      version: '9.9.9',
      getURL: (p) => p,
    });
    const sendResponse = fake.ping({ type: 'PING' });
    expect(sendResponse).toHaveBeenCalledWith({ status: 'ALIVE', version: '9.9.9' });
  });

  it('PING 以外には応答しない', () => {
    const fake = createFakeRuntime();
    registerExternalPing(fake.runtime, {
      name: 'test',
      version: '9.9.9',
      getURL: (p) => p,
    });
    expect(fake.ping({ type: 'OTHER' })).not.toHaveBeenCalled();
    expect(fake.ping(null)).not.toHaveBeenCalled();
  });
});
