import { log } from '../logging.js';
import {
  isEnvelope,
  type Envelope,
  type MessageType,
  type RequestOf,
  type ResponseOf,
  type WireResult,
} from './messages.js';

export type MessageHandler<T extends MessageType> = (
  payload: RequestOf<T>,
  sender: chrome.runtime.MessageSender
) => ResponseOf<T> | Promise<ResponseOf<T>>;

/**
 * 型付きメッセージ受信ルータ。1コンテキストにつき1インスタンスを作り、
 * attach() で chrome.runtime.onMessage に唯一のリスナとして登録する
 * (リスナが分散していた旧構成を集約したもの)。
 */
export class MessageRouter {
  readonly #handlers = new Map<MessageType, MessageHandler<MessageType>>();

  on<T extends MessageType>(type: T, handler: MessageHandler<T>): this {
    this.#handlers.set(type, handler as unknown as MessageHandler<MessageType>);
    return this;
  }

  attach(runtime: Pick<typeof chrome.runtime, 'onMessage'>): void {
    runtime.onMessage.addListener(
      (message: unknown, sender: chrome.runtime.MessageSender, sendResponse) => {
        if (!isEnvelope(message) || !this.#handlers.has(message.type)) {
          return false;
        }
        void this.dispatch(message, sender).then(sendResponse);
        return true; // sendResponse を非同期に呼ぶことを chrome に伝える
      }
    );
  }

  /** ハンドラの例外は WireResult に変換して送信側へ透過する (握り潰さない) */
  async dispatch(
    envelope: Envelope,
    sender: chrome.runtime.MessageSender
  ): Promise<WireResult<unknown>> {
    const handler = this.#handlers.get(envelope.type);
    if (!handler) {
      return { ok: false, error: `no handler for message type "${envelope.type}"` };
    }
    try {
      return { ok: true, value: await handler(envelope.payload, sender) };
    } catch (error) {
      log.error(`message handler "${envelope.type}" failed:`, error);
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
}
