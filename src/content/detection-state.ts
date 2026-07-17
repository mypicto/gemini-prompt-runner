/**
 * クエリ形式 (?ext-q=... — サーバに漏れる形式) のパラメータを検出したかの単一保持。
 * popup が checkQueryParameterDetection で参照し、警告表示を出す。
 */
export class DetectionState {
  detected = false;
}
