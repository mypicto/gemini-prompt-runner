import type { IconState } from '../config/icons.js';
import type { QueryParameterDto } from '../core/query-parameter.js';

/**
 * 拡張内部メッセージング (background / content / popup 間) の型付き契約。
 * ここにメッセージを追加すると、送信側 (BackgroundClient/TabClient) と
 * 受信側 (MessageRouter.on) の型が自動的に揃う。
 *
 * 注意: externally_connectable の PING 応答はこの契約に含めない。
 * docs/ の GitHub Pages が依存する外部公開 wire のため、
 * background/external-ping.ts で独立して凍結管理する。
 */
export interface ProtocolMap {
  /** content → background: webRequest で捕捉した ext-* パラメータを引き取る */
  requestParameters: { req: undefined; res: QueryParameterDto };
  /** content → background: ツールバーアイコンの状態変更を依頼する */
  updateIcon: { req: { state: IconState }; res: void };
  /** popup → content: 現在のプロンプト/モデルから共有 URL を生成する */
  getGenerateUrl: {
    req: {
      includeModel: boolean;
      includePrompt: boolean;
      autoSend: boolean;
      requiredLogin: boolean;
    };
    res: { url: string };
  };
  /** popup → content: カーソル位置に {{clipboard}} プレースホルダを挿入する */
  insertClipboardKeyword: { req: undefined; res: void };
  /** popup → content: クエリ形式 (サーバ漏洩) のパラメータを検出したか */
  checkQueryParameterDetection: { req: undefined; res: { detected: boolean } };
}

export type MessageType = keyof ProtocolMap;
export type RequestOf<T extends MessageType> = ProtocolMap[T]['req'];
export type ResponseOf<T extends MessageType> = ProtocolMap[T]['res'];

/** wire 上の封筒。payload が undefined のメッセージは type のみで自己完結する */
export interface Envelope<T extends MessageType = MessageType> {
  type: T;
  payload: RequestOf<T>;
}

/** ハンドラの成否を transport レベルで一様に運ぶ */
export type WireResult<T> = { ok: true; value: T } | { ok: false; error: string };

export function isEnvelope(message: unknown): message is Envelope {
  return (
    typeof message === 'object' &&
    message !== null &&
    typeof (message as { type?: unknown }).type === 'string'
  );
}
