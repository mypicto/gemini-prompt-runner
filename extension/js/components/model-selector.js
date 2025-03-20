class ModelSelector {
  constructor(selectorManager) {
    this.selectorManager = selectorManager;
  }
  
  async #findListElement() {
    return await this.selectorManager.getElement('modelList');
  }
  
  async #findItemElement(modelQuery) {
    const elements = await this.selectorManager.getElements('modelMenu');
    for (const [index, element] of elements.entries()) {
      const label = await this.selectorManager.getElement('modelLabel', 1000, element);
      const model = new Model(index, label.textContent);
      if (modelQuery.equalsModel(model)) {
        return element;
      }
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
  
  async selectModel(modelQuery) {
    try {
      await this.#openModelList();
      await this.#selectModelItem(modelQuery);
    } catch (error) {
      if (error instanceof OperationCanceledError) {
        console.debug(error.message);
      } else {
        throw error;
      }
    }
  }

  async #openModelList() {
    const list = await this.#findListElement();
    if (!list) {
      throw new OperationCanceledError('Model list not found');
    }
    this.#click(list);
  }

  async #selectModelItem(modelQuery) {
    const item = await this.#findItemElement(modelQuery);
    if (!item) {
      throw new OperationCanceledError('Model item not found');
    }
    this.#click(item);
  }
}
