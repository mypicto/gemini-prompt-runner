import { describe, expect, it } from 'vitest';
import { Model } from './model.js';
import {
  FallbackModelQuery,
  IdentifierModelQuery,
  NominalModelQuery,
} from './model-query.js';

describe('NominalModelQuery', () => {
  it('大文字小文字と空白を無視して一致する', () => {
    const query = new NominalModelQuery('3.5 Flash');
    expect(query.equalsModel(new Model(0, '3.5  flash '))).toBe(true);
    expect(query.equalsModel(new Model(1, '3.1 Pro'))).toBe(false);
  });

  it('括弧書き (半角/全角) を除去して比較する', () => {
    expect(new NominalModelQuery('3.5 Flash (preview)').getIdentifierString()).toBe('3.5flash');
    expect(new NominalModelQuery('3.5 Flash（プレビュー）').getIdentifierString()).toBe(
      '3.5flash'
    );
  });

  it('メニュー項目との一致 (equalsModel) はバージョン番号込みの厳密一致', () => {
    // ext-m="3.5 Flash" が "2.5 Flash" を誤選択しないための仕様
    const query = new NominalModelQuery('Flash');
    expect(query.equalsModel(new Model(0, '3.5 Flash'))).toBe(false);
  });

  it('equalsQuery は正規化後の識別子で比較する', () => {
    expect(new NominalModelQuery('FLASH').equalsQuery(new NominalModelQuery('flash'))).toBe(true);
    expect(new NominalModelQuery('flash').equalsQuery(new NominalModelQuery('pro'))).toBe(false);
  });

  describe('matchesCurrent (現在モデルラベルとの一致)', () => {
    // 現在モデルラベルは "Flash" (短縮)、メニューは "3.5 Flash" (フル表記) と揺れるため、
    // バージョン番号プレフィックスを除いて比較する (旧実装の既知バグ SKILL.md §5.6 の修正)
    it('短縮表記の現在ラベルとフル表記の指定が一致する', () => {
      expect(
        new NominalModelQuery('3.5 Flash').matchesCurrent(new NominalModelQuery('Flash'))
      ).toBe(true);
      expect(new NominalModelQuery('Flash').matchesCurrent(new NominalModelQuery('3.5 Flash'))).toBe(
        true
      );
    });

    it('モデル名自体が異なれば一致しない', () => {
      expect(new NominalModelQuery('3.5 Flash').matchesCurrent(new NominalModelQuery('Pro'))).toBe(
        false
      );
    });

    it('Nominal 以外 (Identifier) の現在値とは一致しない', () => {
      expect(new NominalModelQuery('Flash').matchesCurrent(new IdentifierModelQuery(0))).toBe(
        false
      );
    });
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

  it('matchesCurrent は厳密一致 (現在ラベルからは index が分からないため常に切替する)', () => {
    expect(new IdentifierModelQuery(0).matchesCurrent(new NominalModelQuery('Flash'))).toBe(false);
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
    expect(
      new FallbackModelQuery([
        new NominalModelQuery('Flash'),
        new NominalModelQuery('Pro'),
      ]).getIdentifierString()
    ).toBe('flash,pro');
  });

  it('equalsQuery は Nominal 相手なら候補のいずれか一致で真', () => {
    const query = new FallbackModelQuery([
      new NominalModelQuery('Flash'),
      new NominalModelQuery('Pro'),
    ]);
    expect(query.equalsQuery(new NominalModelQuery('pro'))).toBe(true);
    expect(query.equalsQuery(new NominalModelQuery('ultra'))).toBe(false);
  });

  it('matchesCurrent は候補のいずれかが現在値と一致すれば真', () => {
    const query = new FallbackModelQuery([
      new NominalModelQuery('3.5 Flash'),
      new NominalModelQuery('3.1 Pro'),
    ]);
    expect(query.matchesCurrent(new NominalModelQuery('Pro'))).toBe(true);
    expect(query.matchesCurrent(new NominalModelQuery('Ultra'))).toBe(false);
  });

  it('空配列では構築できない', () => {
    expect(() => new FallbackModelQuery([])).toThrow();
  });
});
