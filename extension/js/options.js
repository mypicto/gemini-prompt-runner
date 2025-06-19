import { SelectorStorageService } from './services/selector-storage-service.js';
import { LocalizeService } from './services/localize-service.js';

/**
 * Options page controller
 * Manages the settings UI and user interactions
 */
class OptionsController {
  constructor() {
    this.storageService = new SelectorStorageService();
    this.localizeService = new LocalizeService();
    this.currentSettings = {};
    this.defaultSettings = {};
    this.customSettings = {};
  }

  /**
   * Initialize the options page
   */
  async init() {
    try {
      await Promise.all([
        this.storageService.init(),
        this.localizeService.init()
      ]);

      await this.loadSettings();
      this.setupEventListeners();
      this.renderSettings();
    } catch (error) {
      console.error('Failed to initialize options page:', error);
      this.showError('Failed to initialize settings page');
    }
  }

  /**
   * Load all settings
   */
  async loadSettings() {
    [this.currentSettings, this.defaultSettings, this.customSettings] = await Promise.all([
      this.storageService.getSettings(),
      this.storageService.getDefaultSettings(),
      this.storageService.getCustomSettings()
    ]);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    document.getElementById('saveButton').addEventListener('click', () => this.saveSettings());
  }

  /**
   * Render settings UI
   */
  renderSettings() {
    const container = document.getElementById('settingsGrid');
    container.innerHTML = '';

    for (const [key, config] of Object.entries(this.defaultSettings)) {
      const settingElement = this.createSettingElement(key, config);
      container.appendChild(settingElement);
    }
  }

  /**
   * Create a setting element
   */
  createSettingElement(key, config) {
    const customValue = this.customSettings[key] || {};

    const div = document.createElement('div');
    div.className = 'setting-item';
    div.innerHTML = `
      <div class="setting-header">
        <h3 class="setting-title">${key}</h3>
      </div>
      
      <div class="setting-field">
        <label for="${key}-selector">CSS Selector:</label>
        <textarea 
          id="${key}-selector" 
          placeholder='${this.defaultSettings[key].selector}'
          data-key="${key}" 
          data-field="selector"
        >${customValue.selector || ''}</textarea>
      </div>
      
      <div id="${key}-test-result" class="test-result" style="display: none;"></div>
    `;

    return div;
  }

  /**
   * Show test result
   */
  showTestResult(resultDiv, message, isSuccess) {
    resultDiv.textContent = message;
    resultDiv.className = `test-result ${isSuccess ? 'test-success' : 'test-error'}`;
    resultDiv.style.display = 'block';
    
    setTimeout(() => {
      resultDiv.style.display = 'none';
    }, 5000);
  }

  /**
   * Save all settings
   */
  async saveSettings() {
    try {
      const newSettings = {};
      
      // Collect all input values
      document.querySelectorAll('[data-key]').forEach(input => {
        const key = input.dataset.key;
        const field = input.dataset.field;
        const value = input.value.trim();
        
        if (value) {
          if (!newSettings[key]) {
            newSettings[key] = {};
          }
          newSettings[key][field] = value;
        }
      });

      await this.storageService.saveSettings(newSettings);
      await this.loadSettings();
      this.renderSettings();
      this.showSuccess('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.showError('Failed to save settings');
    }
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    const statusDiv = document.getElementById('saveStatus');
    statusDiv.textContent = message;
    statusDiv.className = 'save-status success';
    
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }

  /**
   * Show error message
   */
  showError(message) {
    const statusDiv = document.getElementById('saveStatus');
    statusDiv.textContent = message;
    statusDiv.className = 'save-status error';
    
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 5000);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  window.optionsController = new OptionsController();
  await window.optionsController.init();
});
