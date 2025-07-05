import { SelectorDomainService } from './selector-domain-service.js';

export class SelectorService {
  constructor() {
    this.data = {};
    this.domainService = new SelectorDomainService();
  }

  async init() {
    await this.domainService.init();
    this.data = await this.domainService.getMergedSelectors();
  }

  async #updateSelectorStatus(id, success, errorMessage = '') {
    await this.domainService.updateSelectorStatus(id, success, errorMessage);
  }

  async getElement(id, timeout = 1000, contextNode = document) {
    const entry = this.data[id];
    if (!entry) {
      const error = `Selector entry not found for ID "${id}"`;
      this.#updateSelectorStatus(id, false, error);
      throw new Error(error);
    }

    const startTime = Date.now();
    do {
      try {
        let baseElement = contextNode;
        if (entry.selector && baseElement) {
          baseElement = baseElement.querySelector(entry.selector);
        }

        if (baseElement) {
          if (entry.xpath) {
            const result = document.evaluate(
              entry.xpath,
              baseElement,
              null,
              XPathResult.FIRST_ORDERED_NODE_TYPE,
              null
            );
            const subElement = result.singleNodeValue;
            if (subElement) {
              this.#updateSelectorStatus(id, true);
              return subElement;
            }
          } else {
            this.#updateSelectorStatus(id, true);
            return baseElement;
          }
        }
      } catch (error) {
        this.#updateSelectorStatus(id, false, error.message);
        throw error;
      }
      await new Promise(r => setTimeout(r, 100));
    } while (Date.now() - startTime < timeout);
    
    const error = `Timeout: Could not find element for ID "${id}"`;
    this.#updateSelectorStatus(id, false, error);
    throw new Error(error);
  }

  async getElements(id, timeout = 1000, contextNode = document) {
    const entry = this.data[id];
    if (!entry || !entry.selector) {
      const error = `Selector with ID "${id}" does not exist or has no "selector".`;
      this.#updateSelectorStatus(id, false, error);
      throw new Error(error);
    }

    const startTime = Date.now();
    do {
      try {
        const elements = contextNode.querySelectorAll(entry.selector);
        if (elements.length > 0) {
          this.#updateSelectorStatus(id, true);
          return elements;
        }
      } catch (error) {
        this.#updateSelectorStatus(id, false, error.message);
        throw error;
      }
      await new Promise(r => setTimeout(r, 100));
    } while (Date.now() - startTime < timeout);
    
    const error = `Timeout: Could not find elements for ID "${id}"`;
    this.#updateSelectorStatus(id, false, error);
    throw new Error(error);
  }
}
