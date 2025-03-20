class ModelQuery {
  constructor() {
  }
  
  equalsModel(model) {
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
  
    #normalizeModelName(name) {
      name = name.replace(/\(.*\)/g, '');
      return name.toLowerCase().replace(/\s+/g, '');
    }
  }