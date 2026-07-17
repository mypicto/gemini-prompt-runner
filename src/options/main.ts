import { log } from '../shared/logging.js';
import { createChromeSyncStore } from '../shared/platform/storage.js';
import { SelectorHealth } from '../shared/selectors/selector-health.js';
import { StorageSelectorRepository } from '../shared/selectors/selector-repository.js';
import { SelectorSettings } from '../shared/selectors/selector-settings.js';
import { createOptionsApp } from './app.js';

/**
 * オプション画面の composition root。
 * chrome.* / document などのグローバルに触れるのはこのファイルのみ。
 * セレクタ設定は端末間で共有したいので chrome.storage.sync を使う。
 */
document.addEventListener('DOMContentLoaded', () => {
  const repository = new StorageSelectorRepository(createChromeSyncStore());
  const app = createOptionsApp({
    document,
    settings: new SelectorSettings(repository),
    health: new SelectorHealth(repository),
  });
  void app
    .init()
    .catch((error: unknown) => log.error('Failed to initialize options page:', error));
});
