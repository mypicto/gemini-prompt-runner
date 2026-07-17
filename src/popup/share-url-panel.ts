import { REDIRECT_BASE_URL } from '../shared/config/urls.js';
import { log } from '../shared/logging.js';
import type { ClipboardPort } from '../shared/platform/clipboard.js';
import type { TabClient } from '../shared/platform/messaging.js';
import type { Localizer } from '../shared/ui/localize.js';
import { toRedirectUrl } from './redirect-url.js';
import type { ShareOptions, ShareOptionsStore } from './share-options-store.js';

/**
 * 共有 URL 生成パネル (#urlGenerateOptions)。
 * オプションの復元/保存、content への URL 生成依頼、クリップボードへのコピー、
 * {{clipboard}} プレースホルダ挿入ボタンを担当する。
 */
export class ShareUrlPanel {
  readonly #document: Document;
  readonly #tabClient: TabClient;
  readonly #clipboard: ClipboardPort;
  readonly #localizer: Localizer;
  readonly #store: ShareOptionsStore;

  readonly #includeModel: HTMLInputElement | null;
  readonly #includePrompt: HTMLInputElement | null;
  readonly #autoSend: HTMLInputElement | null;
  readonly #requiredLogin: HTMLInputElement | null;
  readonly #redirectUrl: HTMLInputElement | null;
  readonly #urlGenerateButton: HTMLButtonElement | null;
  readonly #clipboardInsertButton: HTMLButtonElement | null;

  constructor(deps: {
    document: Document;
    tabClient: TabClient;
    clipboard: ClipboardPort;
    localizer: Localizer;
    store: ShareOptionsStore;
  }) {
    this.#document = deps.document;
    this.#tabClient = deps.tabClient;
    this.#clipboard = deps.clipboard;
    this.#localizer = deps.localizer;
    this.#store = deps.store;

    this.#includeModel = this.#element<HTMLInputElement>('includeModel');
    this.#includePrompt = this.#element<HTMLInputElement>('includePrompt');
    this.#autoSend = this.#element<HTMLInputElement>('autoSend');
    this.#requiredLogin = this.#element<HTMLInputElement>('requiredLogin');
    this.#redirectUrl = this.#element<HTMLInputElement>('redirectUrl');
    this.#urlGenerateButton = this.#element<HTMLButtonElement>('urlGenerateButton');
    this.#clipboardInsertButton = this.#element<HTMLButtonElement>('clipboardInsertButton');
  }

  async init(): Promise<void> {
    this.#applyOptions(await this.#store.get());

    for (const checkbox of this.#checkboxes()) {
      checkbox.addEventListener('change', () => {
        void this.#store
          .save(this.#readOptions())
          .catch((error: unknown) => log.error('Failed to save share options:', error));
      });
    }
    this.#includePrompt?.addEventListener('change', () => this.#updateAutoSendState());
    this.#urlGenerateButton?.addEventListener('click', () => {
      void this.#handleCopyClick().catch((error: unknown) =>
        log.error('Failed to copy share URL:', error)
      );
    });
    this.#clipboardInsertButton?.addEventListener('click', () => {
      void this.#tabClient
        .sendToActiveTab('insertClipboardKeyword')
        .catch((error: unknown) => log.error('Failed to insert clipboard keyword:', error));
    });

    // アクティブタブで URL を生成できない (= content 不在) なら
    // パネル全体を操作不能にする (旧挙動どおり)。
    const url = await this.#generateUrl();
    if (url === null) {
      this.#disableOptions();
      if (this.#urlGenerateButton) {
        this.#urlGenerateButton.disabled = true;
      }
    }
  }

  async #handleCopyClick(): Promise<void> {
    let url = await this.#generateUrl();
    if (url === null) {
      return;
    }
    if (this.#readOptions().redirectUrl) {
      url = toRedirectUrl(url, REDIRECT_BASE_URL);
    }
    await this.#clipboard.write(url);
    if (this.#urlGenerateButton) {
      this.#urlGenerateButton.textContent = this.#localizer.getMessage('popupCopySuccess');
      this.#urlGenerateButton.classList.add('copied');
    }
    this.#disableOptions();
  }

  async #generateUrl(): Promise<string | null> {
    const options = this.#readOptions();
    try {
      const response = await this.#tabClient.sendToActiveTab('getGenerateUrl', {
        includeModel: options.includeModel,
        includePrompt: options.includePrompt,
        autoSend: options.autoSend,
        requiredLogin: options.requiredLogin,
      });
      return response?.url ?? null;
    } catch (error) {
      // content 側のハンドラが例外を投げたケース。URL は得られないので
      // 「生成不可 (null)」と同じ扱いにする。
      log.error('Failed to generate share URL:', error);
      return null;
    }
  }

  #readOptions(): ShareOptions {
    return {
      includeModel: this.#includeModel?.checked ?? false,
      includePrompt: this.#includePrompt?.checked ?? false,
      autoSend: this.#autoSend?.checked ?? false,
      requiredLogin: this.#requiredLogin?.checked ?? false,
      redirectUrl: this.#redirectUrl?.checked ?? false,
    };
  }

  #applyOptions(options: ShareOptions): void {
    if (this.#includeModel) this.#includeModel.checked = options.includeModel;
    if (this.#includePrompt) this.#includePrompt.checked = options.includePrompt;
    if (this.#autoSend) this.#autoSend.checked = options.autoSend;
    if (this.#requiredLogin) this.#requiredLogin.checked = options.requiredLogin;
    if (this.#redirectUrl) this.#redirectUrl.checked = options.redirectUrl;
    this.#updateAutoSendState();
  }

  /** プロンプトを含めない場合、自動送信は意味を持たないため無効化する */
  #updateAutoSendState(): void {
    if (!this.#autoSend) {
      return;
    }
    if (this.#includePrompt?.checked) {
      this.#autoSend.disabled = false;
    } else {
      this.#autoSend.disabled = true;
      this.#autoSend.checked = false;
    }
  }

  #disableOptions(): void {
    for (const checkbox of this.#checkboxes()) {
      checkbox.disabled = true;
    }
    if (this.#clipboardInsertButton) {
      this.#clipboardInsertButton.disabled = true;
    }
    for (const icon of this.#document.querySelectorAll('.help-icon')) {
      icon.classList.add('disabled');
    }
  }

  #checkboxes(): HTMLInputElement[] {
    return [
      this.#includeModel,
      this.#includePrompt,
      this.#autoSend,
      this.#requiredLogin,
      this.#redirectUrl,
    ].filter((checkbox): checkbox is HTMLInputElement => checkbox !== null);
  }

  #element<T extends HTMLElement>(id: string): T | null {
    return this.#document.getElementById(id) as T | null;
  }
}
