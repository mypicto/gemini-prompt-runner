class ModelSelector {
  constructor(selectorManager) {
    this.selectorManager = selectorManager;
  }
  
  async #findListElement() {
    return await this.selectorManager.getElement('modelList');
  }
  
  async #findItemElement(modelIndex) {
    const elements = await this.selectorManager.getElements('modelMenu');
    if (elements.length > modelIndex) {
      return elements[modelIndex];
    }
    return null;
  }
  
  #click(buttonElement) {
    const event = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true
    });
    buttonElement.dispatchEvent(event);
  }
  
  async selectModel(modelIndex) {
    const list = await this.#findListElement();
    if (!list) {
      console.warn('Model list not found');
      return;
    }
    this.#click(list);
    const item = await this.#findItemElement(modelIndex);
    if (!item) {
      console.warn('Model item not found');
      return;
    }
    this.#click(item);
  }
}