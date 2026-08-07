/** 待機系 (waitFor) がタイムアウトしたときに投げる。文字列比較ではなく instanceof で判定する */
export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

/** 操作対象が存在しない等で処理を中断するが、異常ではないケースに使う */
export class OperationCanceledError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OperationCanceledError';
  }
}
