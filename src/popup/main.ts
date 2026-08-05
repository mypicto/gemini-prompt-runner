import { log } from '../shared/logging.js';
import { NavigatorClipboard } from '../shared/platform/clipboard.js';
import { ChromeI18n } from '../shared/platform/i18n.js';
import { ChromeTabClient } from '../shared/platform/messaging.js';
import { ChromeRuntimeInfo } from '../shared/platform/runtime-info.js';
import { createChromeLocalStore } from '../shared/platform/storage.js';
import { ChromeTabs } from '../shared/platform/tabs.js';
import { Localizer } from '../shared/ui/localize.js';
import { createPopupApp } from './app.js';
import { ShareOptionsStore } from './share-options-store.js';

/**
 * popup の composition root。
 * chrome.* / document などのグローバルに触れるのはこのファイルのみ。
 */
document.addEventListener('DOMContentLoaded', () => {
  const app = createPopupApp({
    document,
    tabClient: new ChromeTabClient(),
    clipboard: new NavigatorClipboard(),
    localizer: new Localizer(new ChromeI18n(), document),
    tabs: new ChromeTabs(),
    runtimeInfo: new ChromeRuntimeInfo(),
    // 共有オプションは端末ローカルの好みなので chrome.storage.local (旧実装踏襲)
    optionsStore: new ShareOptionsStore(createChromeLocalStore()),
  });
  void app.init().catch((error: unknown) => log.error('Failed to initialize popup:', error));
});
