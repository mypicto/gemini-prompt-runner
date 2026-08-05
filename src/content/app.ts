import { GEM_PAGE_SEGMENT } from '../shared/config/urls.js';
import type { ClipboardPort } from '../shared/platform/clipboard.js';
import type { BackgroundClient } from '../shared/platform/messaging.js';
import { MessageRouter } from '../shared/protocol/router.js';
import { SelectorHealth } from '../shared/selectors/selector-health.js';
import type { SelectorRepositoryPort } from '../shared/selectors/selector-repository.js';
import { SelectorSettings } from '../shared/selectors/selector-settings.js';
import { CopyShortcut } from './copy-shortcut.js';
import { DetectionState } from './detection-state.js';
import {
  createDetectionHandler,
  createGenerateUrlHandler,
  createInsertClipboardKeywordHandler,
} from './handlers.js';
import { IconReporter } from './icon-reporter.js';
import { ElementLocator } from './page/element-locator.js';
import { LoginLink } from './page/login-link.js';
import { ModelMenu } from './page/model-menu.js';
import { PageReady } from './page/page-ready.js';
import { PromptTextarea } from './page/prompt-textarea.js';
import { ResponseCopyButton } from './page/response-copy-button.js';
import { SendButton } from './page/send-button.js';
import { ParameterSource } from './parameter-source.js';
import { PromptAssembler } from './prompt-assembler.js';
import { PromptRunWorkflow } from './prompt-run-workflow.js';

export interface ContentDeps {
  document: Document;
  location: Location;
  history: History;
  isMac: boolean;
  background: BackgroundClient;
  clipboard: ClipboardPort;
  selectorRepository: SelectorRepositoryPort;
}

/**
 * content script の配線。chrome.* グローバルには触れない —
 * Port 実装は main.ts (または テスト) が注入する。
 */
export function createContentApp(deps: ContentDeps) {
  const settings = new SelectorSettings(deps.selectorRepository);
  const health = new SelectorHealth(deps.selectorRepository);
  const locator = new ElementLocator({ settings, health, root: deps.document });

  const textarea = new PromptTextarea({ locator, document: deps.document });
  const sendButton = new SendButton(locator);
  const modelMenu = new ModelMenu(locator);
  const copyButton = new ResponseCopyButton(locator);
  const loginLink = new LoginLink(locator);
  const pageReady = new PageReady(locator);

  const iconReporter = new IconReporter(deps.background);
  const detection = new DetectionState();
  const parameterSource = new ParameterSource({
    location: deps.location,
    history: deps.history,
    document: deps.document,
    background: deps.background,
  });
  const copyShortcut = new CopyShortcut({
    copyButton,
    document: deps.document,
    isMac: deps.isMac,
  });

  const workflow = new PromptRunWorkflow({
    assembler: new PromptAssembler(deps.clipboard),
    pageReady,
    textarea,
    sendButton,
    modelMenu,
    loginLink,
    iconReporter,
    isOnGemPage: () => deps.location.pathname.includes(GEM_PAGE_SEGMENT),
  });

  const router = new MessageRouter()
    .on(
      'getGenerateUrl',
      createGenerateUrlHandler({ textarea, modelMenu, location: deps.location })
    )
    .on('insertClipboardKeyword', createInsertClipboardKeywordHandler(textarea))
    .on('checkQueryParameterDetection', createDetectionHandler(detection));

  async function start(): Promise<void> {
    // fragment の ext-* は履歴・共有に残らないよう最速 (document_start) で退避・浄化する
    parameterSource.captureFromLocation();
    copyShortcut.attach();

    await waitForDomContentLoaded(deps.document);
    await locator.init();
    await pageReady.waitUntilReady();

    const parameter = await parameterSource.resolve();
    detection.detected = parameter.isQueryParameterDetected();
    await workflow.run(parameter);
  }

  return { router, start, locator, textarea, sendButton, modelMenu };
}

function waitForDomContentLoaded(document: Document): Promise<void> {
  if (document.readyState !== 'loading') {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    document.addEventListener('DOMContentLoaded', () => resolve());
  });
}
