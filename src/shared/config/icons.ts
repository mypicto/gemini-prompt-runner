/**
 * ツールバーアイコンの意味 (IconState) とパス解決の単一情報源。
 * content script は IconState だけを background へ送り、
 * パスへの解決は background (ActionIconController) のみが行う。
 */
export type IconState =
  | { kind: 'default' }
  | { kind: 'warning' }
  | { kind: 'progress'; percent: number };

export const DEFAULT_ICON = '/images/icon48.png';
export const WARNING_ICON = '/images/icon48-warning.png';

const PROGRESS_ICONS: Record<number, string> = {
  10: '/images/progress10.png',
  20: '/images/progress20.png',
  30: '/images/progress30.png',
  40: '/images/progress40.png',
  50: '/images/progress50.png',
  60: '/images/progress60.png',
  70: '/images/progress70.png',
  80: '/images/progress80.png',
  90: '/images/progress90.png',
  100: '/images/progress100.png',
};

export function iconPathFor(state: IconState): string {
  switch (state.kind) {
    case 'default':
      return DEFAULT_ICON;
    case 'warning':
      return WARNING_ICON;
    case 'progress': {
      // 10% 刻みに丸め、0% でも進行中と分かるよう下限を 10% に切り上げる
      const step = Math.max(10, Math.min(100, Math.round(state.percent / 10) * 10));
      return PROGRESS_ICONS[step] ?? DEFAULT_ICON;
    }
  }
}
