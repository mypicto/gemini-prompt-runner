export class Textarea {
  constructor(selectorManager) {
    this.selectorManager = selectorManager;
  }

  async #findTextareaContainer() {
    return await this.selectorManager.getElement('textareaContainer');
  }

  #createParagraph(line) {
    const p = document.createElement("p");
    if (line === "") {
      const br = document.createElement("br");
      p.appendChild(br);
    } else {
      p.textContent = line;
    }
    return p;
  }

  #extractLineFromParagraph(p) {
    if (p.children.length === 1 && p.children[0].tagName === "BR") {
      return "";
    }
    return p.textContent;
  }

  async #getLastParagraph(container = null) {
    if (!container) {
      container = await this.#findTextareaContainer();
    }
    const paragraphs = container.getElementsByTagName("p");
    return paragraphs.length > 0 ? paragraphs[paragraphs.length - 1] : null;
  }

  #setCursorPosition(range) {
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }

  async setPrompt(prompt) {
    const container = await this.#findTextareaContainer();
    container.innerHTML = "";
    const lines = prompt.split("\n");
    lines.forEach(line => {
      const p = this.#createParagraph(line);
      container.appendChild(p);
    });
    this.moveCursorToEnd(container);
  }

  async getPrompt() {
    const container = await this.#findTextareaContainer();
    const paragraphs = container.getElementsByTagName("p");
    const lines = [];
    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i];
      lines.push(this.#extractLineFromParagraph(p));
    }
    return lines.join("\n");
  }

  moveCursorToEnd(element) {
    element.focus();
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    this.#setCursorPosition(range);
  }

  async isCursorInTextareaContainer() {
    const container = await this.#findTextareaContainer();
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      return container.contains(range.commonAncestorContainer);
    }
    return false;
  }

  #insertTextAtPosition(range, text) {
    range.deleteContents();
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.collapse(true);
    this.#setCursorPosition(range);
  }

  async #insertTextAtCursorPosition(text) {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      this.#insertTextAtPosition(range, text);
    }
  }

  async #appendTextToEnd(text) {
    const container = await this.#findTextareaContainer();
    const lastParagraph = await this.#getLastParagraph(container);
    
    if (lastParagraph) {
      const existingText = this. #extractLineFromParagraph(lastParagraph);
      lastParagraph.innerHTML = "";
      lastParagraph.textContent = existingText + text;
    } else {
      const p = this.#createParagraph(text);
      container.appendChild(p);
    }
    this.moveCursorToEnd(container);
  }

  async insertTextAtCursor(text) {
    const isInTextarea = await this.isCursorInTextareaContainer();
    if (isInTextarea) {
      await this.#insertTextAtCursorPosition(text);
    } else {
      await this.#appendTextToEnd(text);
    }
  }
}
