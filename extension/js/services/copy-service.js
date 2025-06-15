export class CopyService {
  constructor(selectorManager, copyButton) {
    this.selectorManager = selectorManager;
    this.copyButton = copyButton;
  }

  isSelectionEmpty() {
    const selection = window.getSelection();
    return (!selection || selection.toString().trim().length === 0);
  }

  async handleCopyShortcut(event) {
    const isMac = navigator.userAgent.includes('Macintosh');
    const isShortcut = (isMac ? event.metaKey : event.ctrlKey) && (event.key.toLowerCase() === 'c');
    if (!isShortcut) return;
    if (this.isSelectionEmpty()) {
      try {
        await this.copyButton.clickMoreMenu();
        await this.copyButton.clickCopyButton();
      } catch (error) {
        if (!(error.message && error.message.startsWith('Timeout:'))) {
          console.error('Error handling copy shortcut:', error);
        }
      }
    }
  }

  addCopyShortcutListener() {
    document.addEventListener('keydown', this.handleCopyShortcut.bind(this));
  }
}
