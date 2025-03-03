function setupObserverWithTimeout(observer, timeoutDuration = 10000) {
  // Set a timeout to disconnect the observer after the specified duration if not already disconnected
  const timeoutId = setTimeout(() => {
    console.error('Observer did not disconnect within the specified timeout.');
    observer.disconnect();
  }, timeoutDuration);

  // Clear the timeout if the observer disconnects
  const originalDisconnect = observer.disconnect.bind(observer);
  observer.disconnect = () => {
    clearTimeout(timeoutId);
    originalDisconnect();
  };
}

class TextareaView {
  findTextareaElement() {
    const TEXTAREA_XPATH = './/div/p';
    const richTextareaElement = document.querySelector('rich-textarea');
    if (richTextareaElement) {
      return document.evaluate(TEXTAREA_XPATH, richTextareaElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    };
    return null;
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

  findActiveSendButtonElement() {
    const element = this.findSendButtonElement();
    if (element && element.getAttribute('aria-disabled') === 'false') {
      return element
    } 
    return null;
  }

  checkAndClickSendButton(sendButtonElement) {
    this.clickButton(sendButtonElement);
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

  observeAndHandleDomMutations(prompt, isRun) {
    const observer = new MutationObserver((mutationsList, observer) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          let isCompleted = this.insertPrompt(prompt, isRun);
          if (isCompleted) {
            observer.disconnect();
            setTimeout(() => {
              QueryParameter.removeParameters();
            }, 5000);
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, attributes: true });

    setupObserverWithTimeout(observer, 10000);
  }

  /**
   * 指定されたプロンプトをテキストエリアに挿入し、実行フラグに応じて送信ボタンを操作します。
   * 
   * @param {string} prompt - 挿入するプロンプトの文字列
   * @param {boolean} isRun - プロンプト挿入後に送信ボタンをクリックするかどうかのフラグ
   * @returns {boolean} - 処理が完了したかどうか
   */
  insertPrompt(prompt, isRun) {
    const textareaElement = this.textareaView.findTextareaElement();
    if (!textareaElement) {
      return false;
    }
    this.textareaView.insertPromptIntoTextarea(textareaElement, prompt);
    if (isRun) {
      const sendButtonElement = this.sendButtonView.findActiveSendButtonElement();
      if (!sendButtonElement) {
        return false;
      }
      console.log('has send button');
      this.sendButtonView.checkAndClickSendButton(sendButtonElement);
    }
    return true
  }
}

const app = new Application();
app.init();
