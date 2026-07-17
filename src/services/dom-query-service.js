export class DomQueryService {

  queryElement(selector, contextNode = document) {
    if (!selector || !contextNode) {
      return null;
    }
    return contextNode.querySelector(selector);
  }

  queryElements(selector, contextNode = document) {
    if (!selector || !contextNode) {
      return [];
    }
    return contextNode.querySelectorAll(selector);
  }

  existsElement(selector, contextNode = document) {
    const element = this.queryElement(selector, contextNode);
    return element !== null;
  }
}
