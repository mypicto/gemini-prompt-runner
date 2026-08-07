import type { ClipboardPort } from '../shared/platform/clipboard.js';
import type { TabClient } from '../shared/platform/messaging.js';
import type { RuntimeInfoPort } from '../shared/platform/runtime-info.js';
import type { TabsPort } from '../shared/platform/tabs.js';
import type { Localizer } from '../shared/ui/localize.js';
import { ExternalLinks } from './external-links.js';
import { HeaderView } from './header-view.js';
import { ManualLauncher } from './manual-launcher.js';
import { QueryWarningView } from './query-warning-view.js';
import type { ShareOptionsStore } from './share-options-store.js';
import { ShareUrlPanel } from './share-url-panel.js';

export interface PopupAppDeps {
  document: Document;
  tabClient: TabClient;
  clipboard: ClipboardPort;
  localizer: Localizer;
  tabs: TabsPort;
  runtimeInfo: RuntimeInfoPort;
  optionsStore: ShareOptionsStore;
}

export interface PopupApp {
  init(): Promise<void>;
}

/**
 * popup の配線のみを行う composition helper。
 * 実 Chrome 実装との結合は main.ts、テストではモック Port を注入する。
 * (ManualLauncher 内の fetch はグローバルだが popup 拡張ページでは
 *  自身の同梱リソース取得に限られるため使用を許可している)
 */
export function createPopupApp(deps: PopupAppDeps): PopupApp {
  const header = new HeaderView({ document: deps.document, runtimeInfo: deps.runtimeInfo });
  const externalLinks = new ExternalLinks({ document: deps.document, tabs: deps.tabs });
  const manualLauncher = new ManualLauncher({
    document: deps.document,
    localizer: deps.localizer,
    runtimeInfo: deps.runtimeInfo,
    tabs: deps.tabs,
  });
  const shareUrlPanel = new ShareUrlPanel({
    document: deps.document,
    tabClient: deps.tabClient,
    clipboard: deps.clipboard,
    localizer: deps.localizer,
    store: deps.optionsStore,
  });
  const queryWarning = new QueryWarningView({
    document: deps.document,
    tabClient: deps.tabClient,
  });

  return {
    async init(): Promise<void> {
      deps.localizer.apply();
      header.apply();
      externalLinks.attach();
      manualLauncher.attach();
      await shareUrlPanel.init();
      await queryWarning.check();
    },
  };
}
