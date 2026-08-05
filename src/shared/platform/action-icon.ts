export interface ActionIconPort {
  /** tabId が undefined の場合は全タブ共通のアイコンを設定する */
  setIcon(tabId: number | undefined, path: string): Promise<void>;
}

export class ChromeActionIcon implements ActionIconPort {
  async setIcon(tabId: number | undefined, path: string): Promise<void> {
    await chrome.action.setIcon({ tabId, path });
  }
}
