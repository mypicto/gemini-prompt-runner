/**
 * 待機・リトライ時間の単一情報源。
 * sleep() へ直値を渡すことは禁止し、必ずここの命名定数を使う (根拠をコメントで残すため)。
 */
export const TIMING = {
  /** セレクタ解決 (ElementLocator) の既定タイムアウト */
  elementLookupTimeoutMs: 1_000,
  /** セレクタ解決のポーリング間隔 */
  elementPollIntervalMs: 100,

  /** ページ主要素が出揃うまでの待機上限。超えても失敗にせず処理を続行する */
  uiReadyTimeoutMs: 6_000,
  /** ページ準備チェックのポーリング間隔 */
  uiReadyPollIntervalMs: 400,

  /**
   * 送信直後、送信ボタンが「応答中」表示 (stop クラス) に変わるまでの猶予。
   * 旧実装の根拠なし固定 1000ms sleep を「状態出現の条件待ち」に置き換えたもの。
   */
  answerStateAppearTimeoutMs: 3_000,
  /** 応答完了 (stop クラス消失) の待機上限 */
  answerCompleteTimeoutMs: 60_000,
  /** 応答状態のポーリング間隔 */
  answerPollIntervalMs: 500,

  /** 完了アイコン (100%) をユーザーに視認させるための意図的な遅延 */
  iconResetDelayMs: 1_000,

  /** ログインリンクは常時表示要素のため、ほぼ即時に見つからなければ不在と判断する */
  loginLinkLookupTimeoutMs: 10,
} as const;
