import { Model } from './model.js';

export class ModelQuery {
  constructor() {
  }
  
  equalsModel(model) {
    throw new Error('Not implemented');
  }

  findModel(models) {
    for (const model of models) {
      if (this.equalsModel(model)) {
        return model;
      }
    }
    return null;
  }

  getIdentifierString() {
    throw new Error('Not implemented');
  }

  equalsQuery(query) {
    throw new Error('Not implemented');
  }
}
  
export class IdentifierModelQuery extends ModelQuery {
  constructor(index) {
      super();
      this.index = index;
    }
    
  equalsModel(model) {
    if (!(model instanceof Model)) {
      throw new Error('Model must be an instance of Model');
    }
    return this.index === model.index;
  }

  getIdentifierString() {
    return this.index.toString();
  }

  equalsQuery(query) {
    if (!(query instanceof IdentifierModelQuery)) return false;
    return this.index === query.index;
  }
}
  
export class NominalModelQuery extends ModelQuery {
  constructor(name) {
    super();
    this.name = name;
  }
  
  equalsModel(model) {
    if (!(model instanceof Model)) {
      throw new Error('Model must be an instance of Model');
    }
    const normalizedName = this.#normalizeModelName(this.name);
    const normalizedModelName = this.#normalizeModelName(model.name);
    return normalizedName === normalizedModelName;
  }

  getIdentifierString() {
    return this.#normalizeModelName(this.name);
  }

  equalsQuery(query) {
    if (!(query instanceof NominalModelQuery)) return false;
    return this.getIdentifierString() === query.getIdentifierString();
  }

  #normalizeModelName(name) {
    name = name.replace(/[\(\（][^)\）]*[\)\）]/g, '');
    return name.toLowerCase().replace(/\s+/g, '');
  }
}

export class FallbackModelQuery extends ModelQuery {
  constructor(queries) {
    super();
    if (!Array.isArray(queries) || queries.length === 0) {
      throw new Error('FallbackModelQuery requires a non-empty array of ModelQuery');
    }
    this.queries = queries;
  }

  equalsModel(model) {
    return this.queries.some(query => query.equalsModel(model));
  }

  findModel(models) {
    for (const query of this.queries) {
      const model = query.findModel(models);
      if (model) {
        return model;
      }
    }
    return null;
  }

  getIdentifierString() {
    return this.queries.map(query => query.getIdentifierString()).join(',');
  }

  equalsQuery(query) {
    if (query instanceof FallbackModelQuery) {
      return this.getIdentifierString() === query.getIdentifierString();
    }
    return this.queries.some(candidate => candidate.equalsQuery(query));
  }
}
