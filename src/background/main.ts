import { GEMINI_MATCH_PATTERN } from '../shared/config/urls.js';
import { ChromeActionIcon } from '../shared/platform/action-icon.js';
import { ChromeRuntimeInfo } from '../shared/platform/runtime-info.js';
import { MessageRouter } from '../shared/protocol/router.js';
import { ActionIconController } from './action-icon-controller.js';
import { registerExternalPing } from './external-ping.js';
import { PendingParameters } from './pending-parameters.js';

// Service Worker の composition root。副作用 (リスナ登録) はこのファイルに集約する。

const pendingParameters = new PendingParameters();
const iconController = new ActionIconController(new ChromeActionIcon());

new MessageRouter()
  .on('requestParameters', () => pendingParameters.take())
  .on('updateIcon', ({ state }, sender) => iconController.apply(sender.tab?.id, state))
  .attach(chrome.runtime);

// クエリ形式 (?ext-q=...) はサーバへ漏れる前に rules.json (DNR) が除去するため、
// パラメータ本体はリダイレクト前のリクエスト URL から捕捉して保持する
chrome.webRequest.onBeforeRequest.addListener(
  (details) => pendingParameters.capture(details.url),
  { urls: [GEMINI_MATCH_PATTERN] }
);

chrome.tabs.onActivated.addListener(({ tabId }) => void iconController.restore(tabId));
chrome.tabs.onRemoved.addListener((tabId) => iconController.forget(tabId));

registerExternalPing(chrome.runtime, new ChromeRuntimeInfo());
