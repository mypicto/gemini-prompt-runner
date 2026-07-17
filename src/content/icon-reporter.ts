import type { IconState } from '../shared/config/icons.js';
import type { BackgroundClient } from '../shared/platform/messaging.js';

/** テスト差し替え用の最小界面 */
export interface IconReporting {
  report(state: IconState): void;
}

/**
 * background へアイコン状態 (意味) を送る。パスへの解決は background の責務。
 * ブラウザ起動直後は background が未起動のことがあるため、送信失敗は握り潰す —
 * アイコンは装飾であり、本処理を止める理由にならない。
 */
export class IconReporter implements IconReporting {
  constructor(private readonly background: BackgroundClient) {}

  report(state: IconState): void {
    void this.background.send('updateIcon', { state }).catch(() => {
      // 意図的に無視 (上記コメント参照)
    });
  }
}
