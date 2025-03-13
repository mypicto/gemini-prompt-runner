class Textarea {
  constructor(selectorManager) {
    this.selectorManager = selectorManager;
  }
  
  async #findElement() {
    return await this.selectorManager.getElement('textarea');
 }
  
  async setPrompt(prompt) {
    const element = await this.#findElement();
    element.textContent = prompt;
    this.moveCursorToEnd(element);
  }
  
  moveCursorToEnd(element) {
    element.focus();
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
　 }
}
