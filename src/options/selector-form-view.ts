import {
  DEFAULT_SELECTORS,
  SELECTOR_IDS,
  type SelectorId,
} from '../shared/config/selector-ids.js';

interface SelectorRow {
  item: HTMLElement;
  input: HTMLInputElement;
  resetButton: HTMLButtonElement;
  timestamp: HTMLElement;
  error: HTMLElement;
}

/**
 * オプション画面のセレクタ入力行を SELECTOR_IDS から動的生成する View。
 * selectors.json に ID を追加するとフォームも自動で追従する。
 * class 名と id 規約 (`${id}`, `${id}-timestamp`, `${id}-error`) は
 * 旧 options.html / options.css との互換のため変更しないこと。
 */
export class SelectorFormView {
  readonly #document: Document;
  readonly #rows = new Map<SelectorId, SelectorRow>();

  constructor(deps: { document: Document }) {
    this.#document = deps.document;
  }

  render(): void {
    const group = this.#document.querySelector('#optionsForm .selector-group');
    if (!group) {
      throw new Error('.selector-group not found in #optionsForm');
    }
    for (const id of SELECTOR_IDS) {
      const row = this.#createRow(id);
      group.appendChild(row.item);
      this.#rows.set(id, row);
    }
  }

  getValue(id: SelectorId): string {
    return this.#row(id).input.value;
  }

  setValue(id: SelectorId, value: string): void {
    this.#row(id).input.value = value;
  }

  onReset(callback: (id: SelectorId) => void): void {
    for (const [id, row] of this.#rows) {
      row.resetButton.addEventListener('click', () => callback(id));
    }
  }

  onInput(callback: (id: SelectorId) => void): void {
    for (const [id, row] of this.#rows) {
      row.input.addEventListener('input', () => callback(id));
    }
  }

  showSuccess(id: SelectorId, timestampText: string): void {
    const row = this.#row(id);
    row.item.classList.add('has-success');
    row.item.classList.remove('has-error');
    row.timestamp.textContent = timestampText;
    row.error.textContent = '';
  }

  showError(id: SelectorId, message: string): void {
    const row = this.#row(id);
    row.item.classList.add('has-error');
    row.item.classList.remove('has-success');
    row.timestamp.textContent = '';
    row.error.textContent = message;
  }

  clearStatus(id: SelectorId): void {
    const row = this.#row(id);
    row.item.classList.remove('has-error', 'has-success');
    row.timestamp.textContent = '';
    row.error.textContent = '';
  }

  #createRow(id: SelectorId): SelectorRow {
    const doc = this.#document;

    const item = doc.createElement('div');
    item.className = 'selector-item';

    const label = doc.createElement('label');
    label.htmlFor = id;
    label.textContent = toLabelText(id);

    const inputGroup = doc.createElement('div');
    inputGroup.className = 'input-group';

    const input = doc.createElement('input');
    input.type = 'text';
    input.id = id;
    input.name = id;
    input.placeholder = `Default: ${DEFAULT_SELECTORS[id].selector}`;

    const resetButton = doc.createElement('button');
    resetButton.type = 'button';
    resetButton.className = 'reset-btn';
    resetButton.dataset['selector'] = id;
    resetButton.textContent = 'Reset';

    inputGroup.append(input, resetButton);

    const status = doc.createElement('div');
    status.className = 'selector-status';

    const timestamp = doc.createElement('span');
    timestamp.className = 'timestamp';
    timestamp.id = `${id}-timestamp`;

    const error = doc.createElement('span');
    error.className = 'error-message';
    error.id = `${id}-error`;

    status.append(timestamp, error);
    item.append(label, inputGroup, status);

    return { item, input, resetButton, timestamp, error };
  }

  #row(id: SelectorId): SelectorRow {
    const row = this.#rows.get(id);
    if (!row) {
      throw new Error(`Selector row "${id}" is not rendered`);
    }
    return row;
  }
}

/** camelCase の selectorId を "Textarea Container:" のような表示ラベルへ変換する */
function toLabelText(id: string): string {
  const spaced = id.replace(/([A-Z])/g, ' $1');
  return `${spaced.charAt(0).toUpperCase()}${spaced.slice(1)}:`;
}
