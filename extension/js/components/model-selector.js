class ModelSelector {
  constructor(selectorManager) {
    this.selectorManager = selectorManager;
  }
  
  async #findModelMenuButton() {
    return await this.selectorManager.getElement('modelMenuButton');
  }
  
  async #findModelListButton(modelQuery) {
    const buttons = await this.selectorManager.getElements('modelListButton');
    for (const [index, button] of buttons.entries()) {
      const label = await this.selectorManager.getElement('modelListLabel', 1000, button);
      const model = new Model(index, label.textContent);
      if (modelQuery.equalsModel(model)) {
        return button;
      }
    }
    return null;
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

  async getCurrentModelQuery() {
    const element = await this.selectorManager.getElement('currentModelLabel');
    return new NominalModelQuery(element.textContent);
  }

  async #openModelList() {
    const button = await this.#findModelMenuButton();
    if (!button) {
      throw new OperationCanceledError('Model list not found');
    }
    button.click();
  }

  async #selectModelItem(modelQuery) {
    const button = await this.#findModelListButton(modelQuery);
    if (!button) {
      throw new OperationCanceledError('Model item not found');
    }
    button.click();
  }
}
