export class SendButton {
  constructor(selectorManager) {
    this.selectorManager = selectorManager;
  }

  async #findElement() {
    return await this.selectorManager.getElement('sendButton');
  }

  async submit() {
    const element = await this.#findElement();
    if (element) {
      element.click();
    }
  }

  async isAnswering() {
    const element = await this.#findElement();
    if (element) {
      return element.classList.contains('stop');
    }
    return false;
  }
}