export class SelectorService {
  constructor() {
    this.data = {};
    this.storageKey = 'selectorSettings';
  }

  async init() {
    // Load default settings from file
    const res = await fetch(chrome.runtime.getURL('res/selectors.json'));
    const defaultData = await res.json();
    
    // Load custom settings from storage
    try {
      const result = await chrome.storage.sync.get(this.storageKey);
      const customSettings = result[this.storageKey] || {};
      
      // Merge custom settings with defaults (custom takes priority)
      this.data = this.mergeSettings(defaultData, customSettings);
    } catch (error) {
      console.warn('Failed to load custom selector settings, using defaults:', error);
      this.data = defaultData;
    }
  }

  /**
   * Merge custom settings with defaults
   * @param {Object} defaults - Default settings
   * @param {Object} custom - Custom settings
   * @returns {Object} Merged settings
   */
  mergeSettings(defaults, custom) {
    const merged = { ...defaults };
    
    for (const [key, value] of Object.entries(custom)) {
      if (defaults.hasOwnProperty(key)) {
        merged[key] = { ...defaults[key], ...value };
      } else {
        merged[key] = value;
      }
    }
    
    return merged;
  }

  async getElement(id, timeout = 1000, contextNode = document) {
    const entry = this.data[id];
    if (!entry) {
      throw new Error(`Selector entry not found for ID "${id}"`);
    }

    const startTime = Date.now();
    do {
      let baseElement = contextNode;
      if (entry.selector && baseElement) {
        return baseElement.querySelector(entry.selector);
      }
      
      await new Promise(r => setTimeout(r, 100));
    } while (Date.now() - startTime < timeout);
    throw new Error(`Timeout: Could not find element for ID "${id}"`);
  }

  async getElements(id, timeout = 1000, contextNode = document) {
    const entry = this.data[id];
    if (!entry || !entry.selector) {
      throw new Error(`Selector with ID "${id}" does not exist or has no "selector".`);
    }

    const startTime = Date.now();
    do {
      const elements = contextNode.querySelectorAll(entry.selector);
      if (elements.length > 0) {
        return elements;
      }
      await new Promise(r => setTimeout(r, 100));
    } while (Date.now() - startTime < timeout);
    throw new Error(`Timeout: Could not find elements for ID "${id}"`);
  }
}
