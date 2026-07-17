import type {
  Envelope,
  MessageType,
  RequestOf,
  ResponseOf,
  WireResult,
} from '../protocol/messages.js';

/** 受信側が存在しない (background 未起動 / content 未注入) ことを表す */
export class NoReceiverError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NoReceiverError';
  }
}

/** payload を持たないメッセージは第2引数なしで送れるようにする */
type SendArgs<T extends MessageType> =
  RequestOf<T> extends undefined ? [] : [payload: RequestOf<T>];

/** content / popup → background への送信 */
export interface BackgroundClient {
  send<T extends MessageType>(type: T, ...args: SendArgs<T>): Promise<ResponseOf<T>>;
}

/** popup → アクティブタブの content への送信 */
export interface TabClient {
  /**
   * アクティブタブへ送る。content script が注入されていないタブ
   * (Gemini 以外のページ等) は null を返す — これは popup の正常系。
   */
  sendToActiveTab<T extends MessageType>(
    type: T,
    ...args: SendArgs<T>
  ): Promise<ResponseOf<T> | null>;
}

export class ChromeBackgroundClient implements BackgroundClient {
  async send<T extends MessageType>(type: T, ...args: SendArgs<T>): Promise<ResponseOf<T>> {
    const envelope: Envelope<T> = { type, payload: args[0] as RequestOf<T> };
    let result: WireResult<ResponseOf<T>> | undefined;
    try {
      result = await chrome.runtime.sendMessage(envelope);
    } catch (error) {
      throw new NoReceiverError(
        `background did not receive "${type}": ${error instanceof Error ? error.message : String(error)}`
      );
    }
    return unwrap(type, result);
  }
}

export class ChromeTabClient implements TabClient {
  async sendToActiveTab<T extends MessageType>(
    type: T,
    ...args: SendArgs<T>
  ): Promise<ResponseOf<T> | null> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id === undefined) {
      return null;
    }
    const envelope: Envelope<T> = { type, payload: args[0] as RequestOf<T> };
    let result: WireResult<ResponseOf<T>> | undefined;
    try {
      result = await chrome.tabs.sendMessage(tab.id, envelope);
    } catch {
      return null; // 受信者なし = content 未注入タブ (正常系)
    }
    return unwrap(type, result);
  }
}

function unwrap<T>(type: MessageType, result: WireResult<T> | undefined): T {
  if (!result) {
    throw new NoReceiverError(`no response for "${type}"`);
  }
  if (!result.ok) {
    throw new Error(`"${type}" failed on the receiving side: ${result.error}`);
  }
  return result.value;
}
