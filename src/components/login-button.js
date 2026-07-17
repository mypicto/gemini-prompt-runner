export class LoginButton {
  constructor(selectorManager) {
    this.selectorManager = selectorManager;
  }

  async #findElement() {
    try {
      return await this.selectorManager.getElement('serviceLoginLink', 10);
    } catch (error) {
      return null;
    }
  }

  exists() {
    const element = this.selectorManager.existsElement('serviceLoginLink');
    return !!element;
  }

  async click() {
    const element = await this.#findElement();
    if (element) {
      element.click();
      return true;
    }
    return false;
  }
}