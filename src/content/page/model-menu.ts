import { OperationCanceledError } from '../../shared/async/errors.js';
import { Model } from '../../shared/core/model.js';
import { NominalModelQuery, type ModelQuery } from '../../shared/core/model-query.js';
import { log } from '../../shared/logging.js';
import type { ElementLocator } from './element-locator.js';

/** Gemini のモデル切替メニュー。開閉・現在モデルの取得・項目選択を行う */
export class ModelMenu {
  constructor(private readonly locator: ElementLocator) {}

  /** ヘッダの現在モデルラベルから作る。短縮表記 ("Flash" 等) のことがある点に注意 */
  async getCurrentModelQuery(): Promise<NominalModelQuery> {
    const label = await this.locator.find('currentModelLabel');
    return new NominalModelQuery(label.textContent ?? '');
  }

  /**
   * メニューを開いて modelQuery に一致する項目を選択する。
   * 一致する項目がない場合は中断扱い (ログのみ) で throw しない。
   */
  async selectModel(modelQuery: ModelQuery): Promise<void> {
    try {
      await this.#openList();
      await this.#selectItem(modelQuery);
    } catch (error) {
      if (error instanceof OperationCanceledError) {
        log.debug(error.message);
      } else {
        throw error;
      }
    }
  }

  async #openList(): Promise<void> {
    const button = await this.locator.find('modelMenuButton');
    button.click();
  }

  async #selectItem(modelQuery: ModelQuery): Promise<void> {
    const buttons = await this.locator.findAll('modelListButton');
    const models: Model[] = [];
    for (const [index, button] of buttons.entries()) {
      try {
        const label = await this.locator.find('modelListLabel', { context: button });
        models.push(new Model(index, label.textContent ?? ''));
      } catch (error) {
        // ラベルを持たないメニュー項目 (区切り線等) はモデル候補から除外する
        log.debug('skipping model list item without label:', error);
      }
    }

    const matched = modelQuery.findModel(models);
    const button = matched ? buttons[matched.index] : null;
    if (!button) {
      throw new OperationCanceledError(
        `Model item not found for "${modelQuery.getIdentifierString()}"`
      );
    }
    button.click();
  }
}
