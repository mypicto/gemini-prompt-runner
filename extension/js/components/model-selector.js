class ModelSelector {
  constructor(selectorManager) {
    this.selectorManager = selectorManager;
  }
  
  async #findListElement() {
    return await this.selectorManager.getElement('modelList');
  }
  
  async #findItemElementFromIndex(modelIndex) {
    const elements = await this.selectorManager.getElements('modelMenu');
    if (elements.length > modelIndex) {
      return elements[modelIndex];
    }
    return null;
  }

  async #findItemElementFromName(modelName) {
    const elements = await this.selectorManager.getElements('modelMenu');
    for (const element of elements) {
      const label = await this.selectorManager.getElement('modelLabel', 1000, element);
      const normalizedLabel = this.#normalizeModelName(label.textContent);
      const normalizedName = this.#normalizeModelName(modelName);
      if (normalizedLabel === normalizedName) {
        return element;
      }
    }
    return null;
  }

  #normalizeModelName(name) {
    name = name.replace(/\(.*\)/g, '');
    return name.toLowerCase().replace(/\s+/g, '');
  }
  
  #click(buttonElement) {
    const event = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true
    });
    buttonElement.dispatchEvent(event);
  }
  
  async selectModel(model) {
    try {
      await this.#openModelList();
      await this.#selectModelItem(model);
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

  async #selectModelItem(model) {
    if (typeof model === 'number') {
      await this.#sekectItemFromIndex(model);
    } else if (typeof model === 'string') {
      await this.#selectItemFromName(model);
    } else {
      throw new Error('Model must be a number or a string');
    }
  }

  async #sekectItemFromIndex(index) {
    const item = await this.#findItemElementFromIndex(index);
    if (!item) {
      throw new OperationCanceledError('Model item not found');
    }
    this.#click(item);
  }

  async #selectItemFromName(name) {
    const item = await this.#findItemElementFromName(name);
    if (!item) {
      throw new OperationCanceledError('Model item not found');
    }
    this.#click(item);
  }
}