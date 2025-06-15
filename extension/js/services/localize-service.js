export class LocalizeService {
  constructor() {
    this.localizeElements = document.querySelectorAll('[localize]');
    this.localizeAttrElements = document.querySelectorAll('[localize-attr]');
  }

  init() {
    this.localizeContent();
    this.localizeAttributes();
  }

  getMessage(key) {
    return chrome.i18n.getMessage(key);
  }

  localizeContent() {
    this.localizeElements.forEach(element => {
      const text = element.textContent;
      const msgKey = this.#extractMessageKey(text);
      if (msgKey) {
        const localizedText = this.getMessage(msgKey);
        element.textContent = localizedText;
      }
    });
  }

  localizeAttributes() {
    this.localizeAttrElements.forEach(element => {
      const attrMappings = element.getAttribute('localize-attr').split(',');
      attrMappings.forEach(mapping => {
        const [attrName, msgKey] = mapping.trim().split(':');
        if (attrName && msgKey) {
          const key = this.#extractMessageKey(msgKey);
          const localizedString = this.getMessage(key);
          element.setAttribute(attrName, localizedString);
        }
      });
    });
  }

  #extractMessageKey(text) {
    const match = text.match(/__MSG_(\w+)__/);
    return match ? match[1] : null;
  }
}