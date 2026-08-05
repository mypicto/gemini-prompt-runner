import { SELECTOR_IDS, type SelectorId } from '../shared/config/selector-ids.js';
import { log } from '../shared/logging.js';
import type { SelectorHealth } from '../shared/selectors/selector-health.js';
import type { SelectorSettings } from '../shared/selectors/selector-settings.js';
import { formatRelativeTime } from './relative-time.js';
import { SelectorFormView } from './selector-form-view.js';

export interface OptionsAppDeps {
  document: Document;
  settings: SelectorSettings;
  health: SelectorHealth;
}

export interface OptionsApp {
  init(): Promise<void>;
}

/**
 * オプション画面の配線。フォーム行は SelectorFormView が SELECTOR_IDS から
 * 動的生成するため、selectors.json の増減に HTML の手修正なしで追従する。
 */
export function createOptionsApp(deps: OptionsAppDeps): OptionsApp {
  const { document, settings, health } = deps;
  const view = new SelectorFormView({ document });
  const statusElement = document.getElementById('status');

  function showStatus(message: string, type: 'success' | 'error'): void {
    if (!statusElement) {
      return;
    }
    statusElement.textContent = message;
    statusElement.className = `status ${type}`;
    statusElement.classList.remove('hidden');
  }

  function hideStatus(): void {
    statusElement?.classList.add('hidden');
  }

  async function loadCustomValues(): Promise<void> {
    for (const id of SELECTOR_IDS) {
      view.setValue(id, await settings.getCustomSelector(id));
    }
  }

  async function updateStatusDisplay(): Promise<void> {
    for (const id of SELECTOR_IDS) {
      const status = await health.get(id);
      if (status.hasError) {
        view.showError(id, status.errorMessage);
      } else if (status.lastSuccessTime) {
        view.showSuccess(id, formatRelativeTime(status.lastSuccessTime, Date.now()));
      } else {
        view.clearStatus(id);
      }
    }
  }

  async function saveSettings(): Promise<void> {
    try {
      for (const id of SELECTOR_IDS) {
        const value = view.getValue(id).trim();
        const changed =
          value !== ''
            ? await settings.updateCustomSelector(id, value)
            : await settings.resetToDefault(id);
        // セレクタが実際に変わったときだけ成否記録をリセットする
        // (触っていないセレクタの成功履歴を消さないため)。
        if (changed) {
          await health.reset(id);
        }
      }
      showStatus('Settings saved successfully!', 'success');
      setTimeout(hideStatus, 3000);
    } catch (error) {
      log.error('Failed to save settings:', error);
      showStatus('Failed to save settings', 'error');
    }
  }

  async function resetAllSettings(): Promise<void> {
    const confirmed =
      document.defaultView?.confirm(
        'Are you sure you want to reset all selectors to default values?'
      ) ?? false;
    if (!confirmed) {
      return;
    }
    try {
      const changedIds = await settings.clearAllCustomSelectors();
      await health.resetMany(changedIds);
      await loadCustomValues();
      showStatus('All settings reset to default values', 'success');
      setTimeout(hideStatus, 3000);
    } catch (error) {
      log.error('Failed to reset settings:', error);
      showStatus('Failed to reset settings', 'error');
    }
  }

  /** 行の Reset は入力欄を空にするだけで、保存は Save ボタンで確定する (旧挙動どおり) */
  function resetSelector(id: SelectorId): void {
    view.setValue(id, '');
    showStatus(`${id} reset to default`, 'success');
    setTimeout(hideStatus, 2000);
  }

  return {
    async init(): Promise<void> {
      view.render();
      view.onReset(resetSelector);
      view.onInput((id) => {
        hideStatus();
        view.clearStatus(id);
      });
      document.getElementById('saveBtn')?.addEventListener('click', () => {
        void saveSettings().catch((error: unknown) => log.error('Failed to save settings:', error));
      });
      document.getElementById('resetAllBtn')?.addEventListener('click', () => {
        void resetAllSettings().catch((error: unknown) =>
          log.error('Failed to reset settings:', error)
        );
      });
      await loadCustomValues();
      await updateStatusDisplay();
    },
  };
}
