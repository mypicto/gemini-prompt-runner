import { log } from '../shared/logging.js';
import { NavigatorClipboard } from '../shared/platform/clipboard.js';
import { ChromeBackgroundClient } from '../shared/platform/messaging.js';
import { createChromeSyncStore } from '../shared/platform/storage.js';
import { StorageSelectorRepository } from '../shared/selectors/selector-repository.js';
import { createContentApp } from './app.js';

// content script の composition root。
// グローバル (chrome / document / window / navigator) に触れるのはこのファイルだけ。

const app = createContentApp({
  document,
  location: window.location,
  history: window.history,
  isMac: navigator.userAgent.includes('Macintosh'),
  background: new ChromeBackgroundClient(),
  clipboard: new NavigatorClipboard(),
  selectorRepository: new StorageSelectorRepository(createChromeSyncStore()),
});

app.router.attach(chrome.runtime);
void app.start().catch((error) => log.error('content script initialization failed:', error));
