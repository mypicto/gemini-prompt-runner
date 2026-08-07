import { OperationCanceledError, TimeoutError } from '../../shared/async/errors.js';
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
   * URL 生成用: 現在選択中のモデルを、選択メニュー項目のフルラベル ("3.6 Flash" 等) から作る。
   * ヘッダの短縮/ローカライズ表記 ("Flash"・"思考モード") では selectModel の照合
   * (modelListLabel との厳密一致) に round-trip しないため、選択照合と同じ項目ラベルを読む。
   * 選択項目を特定できない (メニュー不在の Gem ページ等) 場合はヘッダ読みにフォールバックする。
   */
  async getSelectedModelQuery(): Promise<NominalModelQuery> {
    const label = await this.#readSelectedItemLabel();
    return label !== null ? new NominalModelQuery(label) : this.getCurrentModelQuery();
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

  /** メニューを閉じる (同じボタンのトグル再クリック)。best-effort — 失敗しても致命ではない */
  async #closeList(): Promise<void> {
    try {
      await this.#openList();
    } catch (error) {
      log.debug('failed to close model menu:', error);
    }
  }

  async #selectItem(modelQuery: ModelQuery): Promise<void> {
    const items = await this.#readModelItems();
    // findModel は渡した配列の要素をそのまま返すため、参照一致でボタンを引ける
    // (Model.index はラベル無し項目でギャップが出るので配列位置には使えない)
    const matched = modelQuery.findModel(items.map((item) => item.model));
    const target = matched ? (items.find((item) => item.model === matched) ?? null) : null;
    if (!target) {
      throw new OperationCanceledError(
        `Model item not found for "${modelQuery.getIdentifierString()}"`
      );
    }
    target.button.click();
  }

  /** メニュー項目を列挙し、ラベルを持つものだけ Model 化して要素と対にする */
  async #readModelItems(): Promise<{ model: Model; button: HTMLElement }[]> {
    const buttons = await this.locator.findAll('modelListButton');
    const items: { model: Model; button: HTMLElement }[] = [];
    for (const [index, button] of buttons.entries()) {
      try {
        const label = await this.locator.find('modelListLabel', { context: button });
        items.push({ model: new Model(index, label.textContent ?? ''), button });
      } catch (error) {
        // ラベルを持たないメニュー項目 (区切り線等) はモデル候補から除外する
        log.debug('skipping model list item without label:', error);
      }
    }
    return items;
  }

  /** メニューを開いて選択中項目 (.selected) のフルラベルを読む。特定できなければ null */
  async #readSelectedItemLabel(): Promise<string | null> {
    try {
      await this.#openList();
    } catch (error) {
      if (error instanceof TimeoutError) {
        // メニューボタン不在 (Gem ページ等)。開けていないので閉じ処理も不要
        log.debug('model menu unavailable for URL generation:', error);
        return null;
      }
      throw error;
    }
    try {
      const selected = await this.locator.find('modelListSelectedItem');
      const label = await this.locator.find('modelListLabel', { context: selected });
      return label.textContent ?? null;
    } catch (error) {
      if (error instanceof TimeoutError) {
        log.debug('no selected model item found for URL generation:', error);
        return null;
      }
      throw error;
    } finally {
      await this.#closeList();
    }
  }
}
