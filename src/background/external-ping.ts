import type { RuntimeInfoPort } from '../shared/platform/runtime-info.js';

/**
 * externally_connectable (mypicto.github.io) からの生存確認応答。
 *
 * wire 形式 { type: 'PING' } → { status: 'ALIVE', version } は
 * docs/js/extension-ready-poller.js (GitHub Pages) が依存する公開契約のため凍結。
 * 拡張内部の ProtocolMap とは独立に管理する。
 */
export function registerExternalPing(
  runtime: Pick<typeof chrome.runtime, 'onMessageExternal'>,
  runtimeInfo: RuntimeInfoPort
): void {
  runtime.onMessageExternal.addListener((request: unknown, _sender, sendResponse) => {
    if ((request as { type?: unknown } | null)?.type === 'PING') {
      sendResponse({ status: 'ALIVE', version: runtimeInfo.version });
    }
    return true;
  });
}
