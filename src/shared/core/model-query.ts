import { Model } from './model.js';

/**
 * ext-m によるモデル指定を統一的に扱う Strategy。
 * - IdentifierModelQuery: 番号指定 (ext-m=2)
 * - NominalModelQuery:    名前指定 (ext-m=3.5 Flash)
 * - FallbackModelQuery:   カンマ区切りの候補列 (ext-m=3.5 Flash,3.1 Pro)
 */
export abstract class ModelQuery {
  /** モデルメニューの1項目と一致するか (メニューからの選択に使う厳密な判定) */
  abstract equalsModel(model: Model): boolean;

  /** URL や wire に載せるための正規化済み識別子 */
  abstract getIdentifierString(): string;

  /** クエリ同士の厳密な同一性 */
  abstract equalsQuery(query: ModelQuery): boolean;

  findModel(models: readonly Model[]): Model | null {
    for (const model of models) {
      if (this.equalsModel(model)) {
        return model;
      }
    }
    return null;
  }

  /**
   * 「現在選択中のモデル」との一致判定。
   * Gemini の現在モデルラベルは "Flash" のような短縮表記のことがあるため、
   * equalsQuery より緩い判定をサブクラスが提供できる (既定は厳密判定)。
   */
  matchesCurrent(current: ModelQuery): boolean {
    return this.equalsQuery(current);
  }
}

export class IdentifierModelQuery extends ModelQuery {
  constructor(readonly index: number) {
    super();
  }

  override equalsModel(model: Model): boolean {
    return this.index === model.index;
  }

  override getIdentifierString(): string {
    return this.index.toString();
  }

  override equalsQuery(query: ModelQuery): boolean {
    return query instanceof IdentifierModelQuery && this.index === query.index;
  }
}

export class NominalModelQuery extends ModelQuery {
  constructor(readonly name: string) {
    super();
  }

  override equalsModel(model: Model): boolean {
    return normalizeModelName(this.name) === normalizeModelName(model.name);
  }

  override getIdentifierString(): string {
    return normalizeModelName(this.name);
  }

  override equalsQuery(query: ModelQuery): boolean {
    return (
      query instanceof NominalModelQuery &&
      this.getIdentifierString() === query.getIdentifierString()
    );
  }

  /**
   * 現在モデルラベルは "Flash" (短縮) だがメニューは "3.5 Flash" (フル表記) のように
   * バージョン番号の有無が揺れるため、番号プレフィックスを除いて比較する。
   */
  override matchesCurrent(current: ModelQuery): boolean {
    if (!(current instanceof NominalModelQuery)) {
      return false;
    }
    return (
      stripVersionPrefix(this.getIdentifierString()) ===
      stripVersionPrefix(current.getIdentifierString())
    );
  }
}

export class FallbackModelQuery extends ModelQuery {
  constructor(readonly queries: readonly ModelQuery[]) {
    super();
    if (queries.length === 0) {
      throw new Error('FallbackModelQuery requires a non-empty array of ModelQuery');
    }
  }

  override equalsModel(model: Model): boolean {
    return this.queries.some((query) => query.equalsModel(model));
  }

  /** 候補列の並び順がそのまま優先順位。先に一致した候補のモデルを返す */
  override findModel(models: readonly Model[]): Model | null {
    for (const query of this.queries) {
      const model = query.findModel(models);
      if (model) {
        return model;
      }
    }
    return null;
  }

  override getIdentifierString(): string {
    return this.queries.map((query) => query.getIdentifierString()).join(',');
  }

  override equalsQuery(query: ModelQuery): boolean {
    if (query instanceof FallbackModelQuery) {
      return this.getIdentifierString() === query.getIdentifierString();
    }
    return this.queries.some((candidate) => candidate.equalsQuery(query));
  }

  override matchesCurrent(current: ModelQuery): boolean {
    return this.queries.some((candidate) => candidate.matchesCurrent(current));
  }
}

/** 括弧書き (半角/全角) を除去し、小文字化と空白除去で表記揺れを吸収する */
function normalizeModelName(name: string): string {
  return name
    .replace(/[(（][^)）]*[)）]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '');
}

/** 正規化済み文字列から先頭のバージョン番号 ("3.5" 等) を除去する */
function stripVersionPrefix(normalized: string): string {
  return normalized.replace(/^[\d.]+/, '');
}
