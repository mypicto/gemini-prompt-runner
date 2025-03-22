class Textarea {
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
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
}
