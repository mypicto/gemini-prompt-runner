class TextareaView {
  async findTextareaElement() {
    const TEXTAREA_XPATH = './/div/p';
    const startTime = Date.now();
    while (true) {
      if (Date.now() - startTime > 1000) {
        throw new Error("Timeout: Textarea not found within 5 seconds");
      }
      const richTextareaElement = document.querySelector('rich-textarea');
      if (richTextareaElement) {
        const textarea = document.evaluate(TEXTAREA_XPATH, richTextareaElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (textarea) {
          return textarea;
        }
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  insertPromptIntoTextarea(textareaElement, prompt) {
    if (textareaElement) {
      textareaElement.textContent = prompt;
    }
  }
}

class SendButtonView {
  findSendButtonElement() {
    const inputAreaContentElement = document.querySelector('input-area-content');
    if (inputAreaContentElement) {
      const SEND_BUTTON_XPATH = 'div/div/div[3]/div/div[2]/button';
      return document.evaluate(SEND_BUTTON_XPATH, inputAreaContentElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    }
    return null;
  }

  async findActiveSendButtonElement() {
    const startTime = Date.now();
    while (true) {
      if (Date.now() - startTime > 1000) {
        throw new Error("Timeout: Active send button not found within 5 seconds");
      }
      const element = this.findSendButtonElement();
      if (element && element.getAttribute('aria-disabled') === 'false') {
        return element;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  clickButton(buttonElement) {
    const event = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true
    });
    buttonElement.dispatchEvent(event);
  }
}

class ModelSelectorView {
  async findListButtonElement() {
    const startTime = Date.now();
    while (Date.now() - startTime < 1000) {
      const element = document.querySelector('button.gds-mode-switch-button');
      if (element) {
        return element;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async findModelButtonElement(modelIndex) {
    const startTime = Date.now();
    while (Date.now() - startTime < 1000) {
      const elements = document.querySelectorAll('button.bard-mode-list-button');
      console.log(elements);
      if (elements.length > modelIndex) {
        const element = elements[modelIndex];
        console.log(element);
        if (element && element.getAttribute('aria-disabled') === 'false') {
          return element;
        }
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return null;
  }

  clickButton(buttonElement) {
    const event = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true
    });
    buttonElement.dispatchEvent(event);
  }

  async selectModel(modelIndex) {
    const listButton = await this.findListButtonElement();
    if (!listButton) {
      return
    }
    this.clickButton(listButton);
    const modelButton = await this.findModelButtonElement(modelIndex);
    if (!modelButton) {
      return
    }
    this.clickButton(modelButton);
  }
}

class QueryParameter {
  static getPrompt() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('q');
  }
  static getRunFlag() {
    const urlParams = new URLSearchParams(window.location.search);
    const value = urlParams.get('run');
    if (value === 'true' || value === '1') {
      return true;
    }
    return false;
  }

  static removeParameters() {
    const url = new URL(window.location);
    const params = url.searchParams;
    params.delete('q');
    params.delete('run');
    const newUrl = url.origin + url.pathname + (params.toString() ? '?' + params.toString() : '');
    window.history.replaceState({}, '', newUrl);
  }
}

class Application {
  constructor() {
    this.textareaView = new TextareaView();
    this.modelButtonView = new ModelSelectorView();
    this.sendButtonView = new SendButtonView();
  }

  init() {
    document.addEventListener('DOMContentLoaded', () => {
      const prompt = QueryParameter.getPrompt();
      const isRun = QueryParameter.getRunFlag();
      if (prompt && prompt.trim() !== "") {
        this.observeAndHandleDomMutations(prompt, isRun);
      }
    });
  }

  init() {
    document.addEventListener('DOMContentLoaded', async () => {
      const prompt = QueryParameter.getPrompt();
      const isRun = QueryParameter.getRunFlag();
      if (prompt && prompt.trim() !== "") {
        await this.insertPrompt(prompt, isRun);
        setTimeout(() => {
          QueryParameter.removeParameters();
        }, 5000);
      }
    });
  }

  /**
   * 指定されたプロンプトをテキストエリアに挿入し、実行フラグに応じて送信ボタンを操作します。
   * 
   * @param {string} prompt - 挿入するプロンプトの文字列
   * @param {boolean} isRun - プロンプト挿入後に送信ボタンをクリックするかどうかのフラグ
   * @returns {boolean} - 処理が完了したかどうか
   */
  async insertPrompt(prompt, isRun) {
    const textareaElement = await this.textareaView.findTextareaElement();
    this.textareaView.insertPromptIntoTextarea(textareaElement, prompt);
    // await this.modelButtonView.selectModel(3);
    if (isRun) {
      const sendButtonElement = await this.sendButtonView.findActiveSendButtonElement();
      this.sendButtonView.clickButton(sendButtonElement);
    }
  }
}

const app = new Application();
app.init();
