import { SelectorDomainService } from './services/selector-domain-service.js';

class OptionsPage {
    constructor() {
        this.defaultSelectors = {};
        this.statusElement = document.getElementById('status');
        this.form = document.getElementById('optionsForm');
        this.selectorService = new SelectorDomainService();
        
        this.init();
    }

    async init() {
        await this.selectorService.init();
        await this.loadDefaultSelectors();
        this.setupEventListeners();
        this.populateForm();
        this.updateStatusDisplay();
    }

    async loadDefaultSelectors() {
        try {
            this.defaultSelectors = await this.selectorService.getDefaultSelectors()
        } catch (error) {
            console.error('Failed to load default selectors:', error);
            this.showStatus('Failed to load default selectors', 'error');
        }
    }

    populateForm() {
        Object.keys(this.defaultSelectors).forEach(async selectorId => {
            const input = document.getElementById(selectorId);
            if (input) {
                input.value = await this.selectorService.getCustomSelector(selectorId);
                input.placeholder = `Default: ${this.defaultSelectors[selectorId].selector}`;
            }
        });
    }

    setupEventListeners() {
        const saveButton = document.getElementById('saveBtn');
        const resetAllButton = document.getElementById('resetAllBtn');
        const resetButtons = document.querySelectorAll('.reset-btn');

        saveButton.addEventListener('click', () => this.saveSettings());
        resetAllButton.addEventListener('click', () => this.resetAllSettings());

        resetButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const selectorId = e.target.dataset.selector;
                this.resetSelector(selectorId);
            });
        });

        this.form.addEventListener('input', async (e) => {
            this.hideStatus();
            if (e.target.type === 'text') {
                await this.resetTimestampForSelector(e.target.name);
            }
        });
    }

    async saveSettings() {
        try {
            const formData = new FormData(this.form);

            for (const [key, value] of formData.entries()) {
                if (value.trim() !== '') {
                    await this.selectorService.updateCustomSelector(key, value.trim());
                } else {
                    await this.selectorService.resetToDefault(key);
                }
            }
            
            this.showStatus('Settings saved successfully!', 'success');
            
            setTimeout(() => {
                this.hideStatus();
            }, 3000);
        } catch (error) {
            console.error('Failed to save settings:', error);
            this.showStatus('Failed to save settings', 'error');
        }
    }

    async resetAllSettings() {
        if (confirm('Are you sure you want to reset all selectors to default values?')) {
            try {
                await this.selectorService.clearAllCustomSelectors();
                this.populateForm();
                this.showStatus('All settings reset to default values', 'success');
                
                setTimeout(() => {
                    this.hideStatus();
                }, 3000);
            } catch (error) {
                console.error('Failed to reset settings:', error);
                this.showStatus('Failed to reset settings', 'error');
            }
        }
    }

    resetSelector(selectorId) {
        const input = document.getElementById(selectorId);
        if (input) {
            input.value = '';
            this.showStatus(`${selectorId} reset to default`, 'success');
            
            setTimeout(() => {
                this.hideStatus();
            }, 2000);
        }
    }

    showStatus(message, type) {
        this.statusElement.textContent = message;
        this.statusElement.className = `status ${type}`;
        this.statusElement.classList.remove('hidden');
    }

    hideStatus() {
        this.statusElement.classList.add('hidden');
    }

    updateStatusDisplay() {
        Object.keys(this.defaultSelectors).forEach(async selectorId => {
            const status = await this.selectorService.getSelectorStatus(selectorId);
            console.log(`[${selectorId}] Status:`, status);
            const selectorItem = document.getElementById(selectorId).closest('.selector-item');
            const timestampElement = document.getElementById(`${selectorId}-timestamp`);
            const errorElement = document.getElementById(`${selectorId}-error`);

            if (status) {
                if (status.hasError) {
                    selectorItem.classList.add('has-error');
                    selectorItem.classList.remove('has-success');
                    timestampElement.textContent = '';
                    errorElement.textContent = status.errorMessage;
                } else if (status.lastSuccessTime) {
                    selectorItem.classList.add('has-success');
                    selectorItem.classList.remove('has-error');
                    timestampElement.textContent = this.formatTimestamp(status.lastSuccessTime);
                    errorElement.textContent = '';
                } else {
                    selectorItem.classList.remove('has-error', 'has-success');
                    timestampElement.textContent = '';
                    errorElement.textContent = '';
                }
            } else {
                selectorItem.classList.remove('has-error', 'has-success');
                timestampElement.textContent = '';
                errorElement.textContent = '';
            }
        });
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) {
            return 'Just now';
        } else if (diffMins < 60) {
            return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        } else if (diffHours < 24) {
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else if (diffDays < 7) {
            return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    async resetTimestampForSelector(selectorId) {
        const selectorItem = document.getElementById(selectorId).closest('.selector-item');
        const timestampElement = document.getElementById(`${selectorId}-timestamp`);
        const errorElement = document.getElementById(`${selectorId}-error`);
        
        selectorItem.classList.remove('has-error', 'has-success');
        timestampElement.textContent = '';
        errorElement.textContent = '';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new OptionsPage();
});