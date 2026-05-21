export class CopyButton {
  constructor(selectorManager) {
    this.selectorManager = selectorManager;
  }

  existCopyButton() {
    return this.selectorManager.existsElement('copyButton');
  }

  async clickCopyButton() {
    const copyButtons = await this.selectorManager.getElements('copyButton', 0);
    if (copyButtons && copyButtons.length > 0) {
      copyButtons[copyButtons.length - 1].click();
    }
  }
}
