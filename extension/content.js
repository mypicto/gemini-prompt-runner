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

  checkAndClickSendButton(sendButtonElement) {
    if (sendButtonElement.getAttribute('aria-disabled') === 'false') {
      this.clickButton(sendButtonElement);
    } else {
      const observer = new MutationObserver((mutationsList, observer) => {
        for (const mutation of mutationsList) {
          if (mutation.type === 'attributes' && mutation.attributeName === 'aria-disabled' && sendButtonElement.getAttribute('aria-disabled') === 'false') {
            observer.disconnect();
            this.clickButton(sendButtonElement);
            break;
          }
        }
      });
      observer.observe(sendButtonElement, { attributes: true });

      setupObserverWithTimeout(observer, 10000);
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

class QueryParameter {
  static getParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }

  static removeParameters(name) {
    const url = new URL(window.location);
    const params = url.searchParams;
    params.delete(name);
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
      const prompt = QueryParameter.getParameter('q');
      if (prompt && prompt.trim() !== "") {
        this.observeTextareaAndInsertPrompt(prompt);
      }
    });
  }

  observeTextareaAndInsertPrompt(prompt) {
    const observer = new MutationObserver((mutationsList, observer) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
          const textareaElement = this.textareaView.findTextareaElement();
          if (textareaElement) {
            this.textareaView.insertPromptIntoTextarea(textareaElement, prompt);
            const sendButtonElement = this.sendButtonView.findSendButtonElement();
            if (sendButtonElement) {
              this.sendButtonView.checkAndClickSendButton(sendButtonElement);
              setTimeout(() => {
                QueryParameter.removeParameters('q');
              }, 5000);
            }
            observer.disconnect();
            break;
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setupObserverWithTimeout(observer, 10000);
  }
}

const app = new Application();
app.init();
