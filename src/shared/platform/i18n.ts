export interface I18nPort {
  getMessage(key: string): string;
}

export class ChromeI18n implements I18nPort {
  getMessage(key: string): string {
    return chrome.i18n.getMessage(key);
  }
}
