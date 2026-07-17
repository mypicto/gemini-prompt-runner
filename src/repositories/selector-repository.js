export class SelectorRepository {
  async getCustomSelectors() {
    const result = await chrome.storage.sync.get(['customSelectors']);
    return result.customSelectors || {};
  }

  async getSelectorStatus() {
    const result = await chrome.storage.sync.get(['selectorStatus']);
    return result.selectorStatus || {};
  }

  async saveCustomSelectors(customSelectors) {
    await chrome.storage.sync.set({ customSelectors });
  }

  async saveSelectorStatus(selectorStatus) {
    await chrome.storage.sync.set({ selectorStatus });
  }

  async clearCustomSelectors() {
    await chrome.storage.sync.set({ customSelectors: {} });
  }

  async clearSelectorStatus() {
    await chrome.storage.sync.set({ selectorStatus: {} });
  }
}