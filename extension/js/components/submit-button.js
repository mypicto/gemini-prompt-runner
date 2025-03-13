class SubmitButton {
  constructor(selectorManager) {
    this.selectorManager = selectorManager;
 }
  
  async #findElement() {
    return await this.selectorManager.getElement('submitButton');
  }
  
  async submit() {
    const element = await this.#findElement();
    if (element) {
      element.click();
    }
  }
}