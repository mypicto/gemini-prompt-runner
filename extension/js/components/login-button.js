class LoginButton {
  constructor(selectorManager) {
    this.selectorManager = selectorManager;
  }

  async #findElement() {
    return await this.selectorManager.getElement('serviceLoginLink');
  }

  async exists() {
    const element = await this.#findElement();
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