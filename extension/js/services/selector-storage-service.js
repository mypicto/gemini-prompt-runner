/**
 * Service responsible for managing selector settings storage
 * Follows Single Responsibility Principle - handles only storage operations
 */
export class SelectorStorageService {
  constructor() {
    this.storageKey = 'selectorSettings';
    this.defaultSettings = null;
  }

  /**
   * Initialize the service by loading default settings
   */
  async init() {
    try {
      const response = await fetch(chrome.runtime.getURL('res/selectors.json'));
      this.defaultSettings = await response.json();
    } catch (error) {
      console.error('Failed to load default selectors:', error);
      this.defaultSettings = {};
    }
  }

  /**
   * Get current settings (custom or default)
   * @returns {Promise<Object>} Current selector settings
   */
  async getSettings() {
    if (!this.defaultSettings) {
      await this.init();
    }

    try {
      const result = await chrome.storage.sync.get(this.storageKey);
      const customSettings = result[this.storageKey] || {};
      
      // Merge custom settings with defaults
      return this.mergeSettings(this.defaultSettings, customSettings);
    } catch (error) {
      console.error('Failed to load settings from storage:', error);
      return this.defaultSettings;
    }
  }

  /**
   * Save custom settings to storage
   * @param {Object} settings - Settings to save
   * @returns {Promise<void>}
   */
  async saveSettings(settings) {
    try {
      await chrome.storage.sync.set({
        [this.storageKey]: settings
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  /**
   * Get custom settings only (without defaults)
   * @returns {Promise<Object>} Custom settings
   */
  async getCustomSettings() {
    try {
      const result = await chrome.storage.sync.get(this.storageKey);
      return result[this.storageKey] || {};
    } catch (error) {
      console.error('Failed to load custom settings:', error);
      return {};
    }
  }

  /**
   * Get default settings
   * @returns {Promise<Object>} Default settings
   */
  async getDefaultSettings() {
    if (!this.defaultSettings) {
      await this.init();
    }
    return this.defaultSettings;
  }

  /**
   * Reset settings to defaults
   * @returns {Promise<void>}
   */
  async resetToDefaults() {
    try {
      await chrome.storage.sync.remove(this.storageKey);
    } catch (error) {
      console.error('Failed to reset settings:', error);
      throw error;
    }
  }

  /**
   * Check if a setting is customized
   * @param {string} key - Setting key
   * @returns {Promise<boolean>} True if setting is customized
   */
  async isCustomized(key) {
    const customSettings = await this.getCustomSettings();
    return customSettings.hasOwnProperty(key);
  }

  /**
   * Export settings as JSON
   * @returns {Promise<string>} Settings as JSON string
   */
  async exportSettings() {
    const settings = await this.getCustomSettings();
    return JSON.stringify(settings, null, 2);
  }

  /**
   * Import settings from JSON
   * @param {string} jsonString - JSON string to import
   * @returns {Promise<void>}
   */
  async importSettings(jsonString) {
    try {
      const settings = JSON.parse(jsonString);
      await this.saveSettings(settings);
    } catch (error) {
      console.error('Failed to import settings:', error);
      throw new Error('Invalid JSON format');
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
}
