import { SelectorRepository } from '../repositories/selector-repository.js';

export class SelectorDomainService {
  constructor() {
    this.repository = new SelectorRepository();
    this.defaultData = {};
    this.mutexes = {
      customSelectors: Promise.resolve(),
      selectorStatus: Promise.resolve()
    };
  }

  async withMutex(key, operation) {
    const mutex = this.mutexes[key];
    this.mutexes[key] = mutex.then(operation, operation);
    return this.mutexes[key];
  }

  async init() {
    const res = await fetch(chrome.runtime.getURL('res/selectors.json'));
    this.defaultData = await res.json();
  }

  async updateCustomSelector(id, selector) {
    let selectorChanged = false;
    await this.withMutex('customSelectors', async () => {
      const customSelectors = await this.repository.getCustomSelectors();
      const currentSelector = customSelectors[id] || '';
      selectorChanged = currentSelector !== selector;
      customSelectors[id] = selector;
      await this.repository.saveCustomSelectors(customSelectors);
    });
    if (selectorChanged) {
      await this.resetSelectorStatus(id);
    }
  }

  async resetToDefault(id) {
    let selectorChanged = false;
    await this.withMutex('customSelectors', async () => {
      const customSelectors = await this.repository.getCustomSelectors();
      selectorChanged = customSelectors[id] !== undefined;
      delete customSelectors[id];
      await this.repository.saveCustomSelectors(customSelectors);
    });
    if (selectorChanged) {
      await this.resetSelectorStatus(id);
    }
  }

  async resetSelectorStatus(id) {
    await this.withMutex('selectorStatus', async () => {
      const selectorStatus = await this.repository.getSelectorStatus();
      selectorStatus[id] = {
        lastSuccessTime: null,
        hasError: false,
        errorMessage: ''
      };
      await this.repository.saveSelectorStatus(selectorStatus);
    });
  }

  async updateSelectorStatus(id, success, errorMessage = '') {
    await this.withMutex('selectorStatus', async () => {
      const selectorStatus = await this.repository.getSelectorStatus();
      
      if (!selectorStatus[id]) {
        selectorStatus[id] = {
          lastSuccessTime: null,
          hasError: false,
          errorMessage: ''
        };
      }

      if (success) {
        selectorStatus[id].lastSuccessTime = Date.now();
        selectorStatus[id].hasError = false;
        selectorStatus[id].errorMessage = '';
      } else {
        selectorStatus[id].hasError = true;
        selectorStatus[id].errorMessage = errorMessage;
      }

      await this.repository.saveSelectorStatus(selectorStatus);
    });
  }

  async getMergedSelectors() {
    const customSelectors = await this.repository.getCustomSelectors();
    const merged = { ...this.defaultData };
    
    for (const [key, customSelector] of Object.entries(customSelectors)) {
      if (customSelector && customSelector.trim() !== '') {
        merged[key] = { selector: customSelector };
      }
    }
    
    return merged;
  }

  getDefaultSelector(id) {
    return this.defaultData[id]?.selector || '';
  }
  
  getDefaultSelectors() {
    return this.defaultData;
  }

  async getCustomSelector(id) {
    const customSelectors = await this.repository.getCustomSelectors();
    return customSelectors[id] || '';
  }

  async getSelectorStatus(id) {
    const selectorStatus = await this.repository.getSelectorStatus();
    return selectorStatus[id] || {
      lastSuccessTime: null,
      hasError: false,
      errorMessage: ''
    };
  }

  async getAllSelectorStatus() {
    return await this.repository.getSelectorStatus();
  }

  async clearAllCustomSelectors() {
    let changedIds = [];
    await this.withMutex('customSelectors', async () => {
      const customSelectors = await this.repository.getCustomSelectors();
      changedIds = Object.keys(customSelectors).filter(id => customSelectors[id] !== undefined);
      await this.repository.clearCustomSelectors();
    });
    for (const id of changedIds) {
      await this.resetSelectorStatus(id);
    }
  }
}