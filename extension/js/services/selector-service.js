import { SelectorDomainService } from './selector-domain-service.js';
import { DomQueryService } from './dom-query-service.js';
import { RetryService } from './retry-service.js';

export class SelectorService {
  constructor() {
    this.domainService = new SelectorDomainService();
    this.domQueryService = new DomQueryService();
    this.retryService = new RetryService();

    this.data = {};
  }

  async init() {
    await this.domainService.init();
    this.data = await this.domainService.getMergedSelectors();
  }

  #getSelectorString(id) {
    const entry = this.data[id];
    if (!entry || !entry.selector) {
      throw new Error(`Selector with ID "${id}" does not exist or has no "selector".`);
    }
    return entry.selector;
  }

  async #updateSelectorStatus(id, success, errorMessage = '') {
    await this.domainService.updateSelectorStatus(id, success, errorMessage);
  }

  existsElement(selector, contextNode = document) {
    return this.domQueryService.existsElement(selector, contextNode);
  }

  async getElement(id, timeout = 1000, contextNode = document) {
    try {
      const selector = this.#getSelectorString(id);
      const element = await this.retryService.retryUntilSuccess(
        () => this.domQueryService.queryElement(selector, contextNode),
        timeout
      );
      
      await this.#updateSelectorStatus(id, true);
      return element;
    } catch (error) {
      const errorMessage = error.message.includes('Timeout') 
        ? `Timeout: Could not find element for ID "${id}"`
        : error.message;
      
      await this.#updateSelectorStatus(id, false, errorMessage);
      throw new Error(errorMessage);
    }
  }

  async getElements(id, timeout = 1000, contextNode = document) {
    try {
      const selector = this.#getSelectorString(id);
      const elements = await this.retryService.retryUntilSuccess(
        () => {
          const result = this.domQueryService.queryElements(selector, contextNode);
          return result.length > 0 ? result : null;
        },
        timeout
      );

      await this.#updateSelectorStatus(id, true);
      return elements;
    } catch (error) {
      const errorMessage = error.message.includes('Timeout')
        ? `Timeout: Could not find elements for ID "${id}"`
        : error.message;

      await this.#updateSelectorStatus(id, false, errorMessage);
      throw new Error(errorMessage);
    }
  }
}
