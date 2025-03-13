class SelectorManager {
  constructor() {
    this.data = {};
  }

  addCopyShortcutListener() {
    document.addEventListener('keydown', this.handleCopyShortcut.bind(this));
  }

  async handleCopyShortcut(event) {
    const isMac = navigator.userAgent.includes('Macintosh');
    const isShortcut = (isMac ? event.metaKey : event.ctrlKey) && (event.key.toLowerCase() === 'c');
    if (!isShortcut) {
      return;
    }
    if (this.isSelectionEmpty()) {
      try {
        await this.triggerMoreMenu();
        await this.triggerCopy();
      } catch (error) {
        if (!(error.message && error.message.startsWith('Timeout:'))) {
          console.error('Error handling copy shortcut:', error);
        }
      }
    }
  }

  isSelectionEmpty() {
    const selection = window.getSelection();
    return (!selection || selection.toString().trim().length === 0);
  }

  async triggerMoreMenu() {
    const moreMenuButtons = await this.getElements('moreMenuButton', 0);
    if (moreMenuButtons && moreMenuButtons.length > 0) {
      moreMenuButtons[moreMenuButtons.length - 1].click();
    }
  }

  async triggerCopy() {
    const copyButtons = await this.getElements('copyButton', 0);
    if (copyButtons && copyButtons.length > 0) {
      copyButtons[copyButtons.length - 1].click();
    }
  }

  async init() {
    const res = await fetch(chrome.runtime.getURL('res/selectors.json'));
    this.data = await res.json();
  }

  async getElement(id, timeout = 1000, contextNode = document) {
    const entry = this.data[id];
    if (!entry) {
      throw new Error(`Selector entry not found for ID "${id}"`);
    }

    const startTime = Date.now();
    do {
      let baseElement = contextNode;
      if (entry.selector && baseElement) {
        baseElement = baseElement.querySelector(entry.selector);
      }

      if (baseElement) {
        if (entry.xpath) {
          const result = document.evaluate(
            entry.xpath,
            baseElement,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          );
          const subElement = result.singleNodeValue;
          if (subElement) {
            return subElement;
          }
        } else {
          return baseElement;
        }
      }
      await new Promise(r => setTimeout(r, 100));
    } while (Date.now() - startTime < timeout);
    throw new Error(`Timeout: Could not find element for ID "${id}"`);
  }

  async getElements(id, timeout = 1000, contextNode = document) {
    const entry = this.data[id];
    if (!entry || !entry.selector) {
      throw new Error(`Selector with ID "${id}" does not exist or has no "selector".`);
    }

    const startTime = Date.now();
    do {
      const elements = contextNode.querySelectorAll(entry.selector);
      if (elements.length > 0) {
        return elements;
      }
      await new Promise(r => setTimeout(r, 100));
    } while (Date.now() - startTime < timeout);
    throw new Error(`Timeout: Could not find elements for ID "${id}"`);
  }
}