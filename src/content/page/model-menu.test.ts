import { describe, expect, it, vi } from 'vitest';
import { TimeoutError } from '../../shared/async/errors.js';
import { NominalModelQuery } from '../../shared/core/model-query.js';
import type { ElementLocator } from './element-locator.js';
import { ModelMenu } from './model-menu.js';

/** textContent と click スパイだけ持つ最小のダミー要素 */
class FakeEl {
  click = vi.fn();
  constructor(readonly textContent: string | null = null) {}
}

/** find/findAll を id と context で振り分けるフェイク ElementLocator */
function fakeLocator(config: {
  /** currentModelLabel の textContent。undefined なら見つからない (TimeoutError) */
  header?: string;
  /** modelMenuButton。false なら不在 (Gem ページ相当) を再現 */
  menuButton?: FakeEl | false;
  /** modelListSelectedItem の要素。'timeout' で不在を再現 */
  selectedItem?: FakeEl | 'timeout';
  /** findAll('modelListButton') が返す一覧 */
  listButtons?: FakeEl[];
  /** modelListLabel を context 要素ごとに引く。'timeout' でラベル無し項目を再現 */
  labels?: Map<FakeEl, string | 'timeout'>;
}) {
  const menuButton = config.menuButton === false ? null : (config.menuButton ?? new FakeEl());

  const find = vi.fn(async (id: string, options: { context?: FakeEl } = {}) => {
    switch (id) {
      case 'currentModelLabel':
        if (config.header === undefined) throw new TimeoutError('currentModelLabel');
        return new FakeEl(config.header);
      case 'modelMenuButton':
        if (menuButton === null) throw new TimeoutError('modelMenuButton');
        return menuButton;
      case 'modelListSelectedItem':
        if (config.selectedItem === undefined || config.selectedItem === 'timeout') {
          throw new TimeoutError('modelListSelectedItem');
        }
        return config.selectedItem;
      case 'modelListLabel': {
        const value = options.context ? config.labels?.get(options.context) : undefined;
        if (value === undefined || value === 'timeout') throw new TimeoutError('modelListLabel');
        return new FakeEl(value);
      }
      default:
        throw new Error(`unexpected find id: ${id}`);
    }
  });

  const findAll = vi.fn(async (id: string) => {
    if (id === 'modelListButton') return config.listButtons ?? [];
    throw new Error(`unexpected findAll id: ${id}`);
  });

  const locator = { find, findAll, exists: vi.fn() } as unknown as ElementLocator;
  return { locator, menuButton };
}

describe('ModelMenu.getSelectedModelQuery (URL 生成用)', () => {
  it('ヘッダの短縮形ではなく選択中項目のフルラベルを返す', async () => {
    const selected = new FakeEl();
    const { locator, menuButton } = fakeLocator({
      header: 'Flash',
      selectedItem: selected,
      labels: new Map([[selected, '3.6 Flash']]),
    });
    const menu = new ModelMenu(locator);

    const query = await menu.getSelectedModelQuery();

    expect(query.name).toBe('3.6 Flash');
    expect(query.getIdentifierString()).toBe('3.6flash');
    // メニューを開いて閉じる (トグルクリック 2 回)
    expect(menuButton?.click).toHaveBeenCalledTimes(2);
  });

  it('選択中項目を特定できなければヘッダ読みにフォールバックし、メニューは閉じる', async () => {
    const { locator, menuButton } = fakeLocator({
      header: 'Flash',
      selectedItem: 'timeout',
    });
    const menu = new ModelMenu(locator);

    const query = await menu.getSelectedModelQuery();

    expect(query.name).toBe('Flash');
    // 開いたので閉じ処理も走る (2 回)
    expect(menuButton?.click).toHaveBeenCalledTimes(2);
  });

  it('モデルメニューが無い (Gem ページ等) ならヘッダ読みにフォールバックする', async () => {
    const { locator } = fakeLocator({
      header: 'Pro',
      menuButton: false,
    });
    const menu = new ModelMenu(locator);

    const query = await menu.getSelectedModelQuery();

    expect(query.name).toBe('Pro');
  });
});

describe('ModelMenu.selectModel (項目列挙の index マッピング)', () => {
  it('ラベル無しの区切りを挟んでも index が一致する項目のボタンをクリックする', async () => {
    const flashBtn = new FakeEl();
    const separatorBtn = new FakeEl();
    const proBtn = new FakeEl();
    const { locator } = fakeLocator({
      listButtons: [flashBtn, separatorBtn, proBtn],
      labels: new Map<FakeEl, string | 'timeout'>([
        [flashBtn, '3.6 Flash'],
        [separatorBtn, 'timeout'], // ラベル無し → Model 化されない (index 1 が欠番)
        [proBtn, '3.1 Pro'],
      ]),
    });
    const menu = new ModelMenu(locator);

    await menu.selectModel(new NominalModelQuery('3.1 Pro'));

    // 配列位置 (items[2] は存在しない) ではなく Model.index=2 の proBtn を引けている
    expect(proBtn.click).toHaveBeenCalledTimes(1);
    expect(flashBtn.click).not.toHaveBeenCalled();
    expect(separatorBtn.click).not.toHaveBeenCalled();
  });
});
