export class MemorySelectorRepository {
  constructor() {
    this.customSelectors = {};
    this.selectorStatus = {};
  }

  async getCustomSelectors() {
    return { ...this.customSelectors };
  }

  async getSelectorStatus() {
    return { ...this.selectorStatus };
  }

  async saveCustomSelectors(customSelectors) {
    this.customSelectors = { ...customSelectors };
  }

  async saveSelectorStatus(selectorStatus) {
    this.selectorStatus = { ...selectorStatus };
  }

  async clearCustomSelectors() {
    this.customSelectors = {};
  }

  async clearSelectorStatus() {
    this.selectorStatus = {};
  }
}
