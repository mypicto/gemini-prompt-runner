import { describe, it, expect } from 'vitest';
import {
  IdentifierModelQuery,
  NominalModelQuery,
  FallbackModelQuery,
} from '../../extension/js/models/model-query.js';
import { Model } from '../../extension/js/models/model.js';

describe('NominalModelQuery', () => {
  it('大文字小文字と空白を無視して一致する', () => {
    const query = new NominalModelQuery('3.5 Flash');
    expect(query.equalsModel(new Model(0, '3.5  flash '))).toBe(true);
    expect(query.equalsModel(new Model(1, '3.1 Pro'))).toBe(false);
  });

  it('括弧書き (半角/全角) を除去して比較する', () => {
    const query = new NominalModelQuery('3.5 Flash (preview)');
    expect(query.getIdentifierString()).toBe('3.5flash');
    const fullWidth = new NominalModelQuery('3.5 Flash（プレビュー）');
    expect(fullWidth.getIdentifierString()).toBe('3.5flash');
  });

  // BUG(既知・SKILL.md §5.6): 数字プレフィックスを除去しないため、
  // 現在モデルラベルの短縮表記 "Flash" とメニューのフル表記 "3.5 Flash" が一致しない。
  // Phase 3 で修正する際、このテストを期待挙動 (true) に反転させてから実装を直す。
  it('短縮表記とフル表記は一致しない (現状固定)', () => {
    const query = new NominalModelQuery('Flash');
    expect(query.equalsModel(new Model(0, '3.5 Flash'))).toBe(false);
  });

  it('equalsQuery は正規化後の識別子で比較する', () => {
    expect(new NominalModelQuery('FLASH').equalsQuery(new NominalModelQuery('flash'))).toBe(true);
    expect(new NominalModelQuery('flash').equalsQuery(new NominalModelQuery('pro'))).toBe(false);
  });

  it('Model 以外を渡すと例外', () => {
    const query = new NominalModelQuery('flash');
    expect(() => query.equalsModel({ index: 0, name: 'flash' })).toThrow();
  });
});

describe('IdentifierModelQuery', () => {
  it('index で一致判定する', () => {
    const query = new IdentifierModelQuery(1);
    expect(query.equalsModel(new Model(1, 'anything'))).toBe(true);
    expect(query.equalsModel(new Model(0, 'anything'))).toBe(false);
    expect(query.getIdentifierString()).toBe('1');
  });

  it('equalsQuery は同型かつ同 index のみ真', () => {
    expect(new IdentifierModelQuery(1).equalsQuery(new IdentifierModelQuery(1))).toBe(true);
    expect(new IdentifierModelQuery(1).equalsQuery(new IdentifierModelQuery(2))).toBe(false);
    expect(new IdentifierModelQuery(1).equalsQuery(new NominalModelQuery('1'))).toBe(false);
  });
});

describe('FallbackModelQuery', () => {
  const models = [new Model(0, '3.5 Flash'), new Model(1, '3.1 Pro')];

  it('候補リストの順に探し、最初に一致したクエリのモデルを返す', () => {
    const query = new FallbackModelQuery([
      new NominalModelQuery('3.1 Pro'),
      new NominalModelQuery('3.5 Flash'),
    ]);
    // モデル一覧では Flash が先でも、候補順 (Pro 優先) が勝つ
    expect(query.findModel(models)?.index).toBe(1);
  });

  it('先頭候補が不一致なら次の候補へフォールバックする', () => {
    const query = new FallbackModelQuery([
      new NominalModelQuery('does-not-exist'),
      new NominalModelQuery('3.5 Flash'),
    ]);
    expect(query.findModel(models)?.index).toBe(0);
  });

  it('識別子はカンマ結合', () => {
    const query = new FallbackModelQuery([
      new NominalModelQuery('Flash'),
      new NominalModelQuery('Pro'),
    ]);
    expect(query.getIdentifierString()).toBe('flash,pro');
  });

  it('equalsQuery は Nominal 相手なら候補のいずれか一致で真', () => {
    const query = new FallbackModelQuery([
      new NominalModelQuery('Flash'),
      new NominalModelQuery('Pro'),
    ]);
    expect(query.equalsQuery(new NominalModelQuery('pro'))).toBe(true);
    expect(query.equalsQuery(new NominalModelQuery('ultra'))).toBe(false);
  });

  it('空配列では構築できない', () => {
    expect(() => new FallbackModelQuery([])).toThrow();
  });
});
