class ModelQuery {
  constructor() {
  }
  
  equalsModel(model) {
    throw new Error('Not implemented');
  }

  getIdentifierString() {
    throw new Error('Not implemented');
  }

  equalsQuery(query) {
    throw new Error('Not implemented');
  }
}
  
class IdentifierModelQuery extends ModelQuery {
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
  
  class NominalModelQuery extends ModelQuery {
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
      name = name.replace(/\(.*\)/g, '');
      return name.toLowerCase().replace(/\s+/g, '');
    }
  }
