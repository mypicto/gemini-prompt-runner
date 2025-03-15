class CopyButton {
  constructor(selectorManager) {
    this.selectorManager = selectorManager;
  }

  async clickMoreMenu() {
    const moreMenuButtons = await this.selectorManager.getElements('moreMenuButton', 0);
    if (moreMenuButtons && moreMenuButtons.length > 0) {
      moreMenuButtons[moreMenuButtons.length - 1].click();
    }
  }

  async clickCopyButton() {
    const copyButtons = await this.selectorManager.getElements('copyButton', 0);
    if (copyButtons && copyButtons.length > 0) {
      copyButtons[copyButtons.length - 1].click();
    }
  }
}
