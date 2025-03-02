console.log('Content script loaded.');
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM content loaded.');
  function getQueryParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }

  function insertPromptIntoTextarea(prompt) {
    console.log('Inserting prompt into textarea:', prompt);
    const richTextareaElement = document.querySelector('rich-textarea');
    if (richTextareaElement) {
      const textareaXPath = './/div/p';
      const textareaElement = document.evaluate(textareaXPath, richTextareaElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    
      if (textareaElement) {
        textareaElement.textContent = prompt;
        // textareaElement.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        console.error('Textarea not found.');
      }
    } else {
      console.error('Rich-textarea not found.');
    }
  }

  const prompt = getQueryParameter('q');
  console.log('Prompt:', prompt);
  if (prompt && prompt.trim() !== "") {
    // Use MutationObserver to detect when the textarea is added
    const observer = new MutationObserver((mutationsList, observer) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
          const richTextareaElement = document.querySelector('rich-textarea');
          if (richTextareaElement) {
            const textareaXPath = './/div/p';
            const textareaElement = document.evaluate(textareaXPath, richTextareaElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            if (textareaElement) {
              insertPromptIntoTextarea(prompt);
              clickSendButton();
              observer.disconnect(); // Stop observing once the element is found
              break;
            }
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  function clickSendButton() {
    const inputAreaContentElement = document.querySelector('input-area-content');
    if (inputAreaContentElement) {
      const sendButtonXPath = 'div/div/div[3]/div/div[2]/button';
      const sendButtonElement = document.evaluate(sendButtonXPath, inputAreaContentElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      
      if (sendButtonElement) {
        const checkAndClick = () => {
          if (sendButtonElement.getAttribute('aria-disabled') === 'false') {
            const event = new MouseEvent('click', {
              view: window,
              bubbles: true,
              cancelable: true
            });
            sendButtonElement.dispatchEvent(event);
            console.log('Send button clicked.');
          } else {
            console.log('Waiting for send button to be enabled...');
            const observer = new MutationObserver((mutationsList, observer) => {
              for (const mutation of mutationsList) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'aria-disabled' && sendButtonElement.getAttribute('aria-disabled') === 'false') {
                  observer.disconnect();
                  const event = new MouseEvent('click', {
                    view: window,
                    bubbles: true,
                    cancelable: true
                  });
                  sendButtonElement.dispatchEvent(event);
                  console.log('Send button clicked.');
                  break;
                }
              }
            });
            observer.observe(sendButtonElement, { attributes: true });
          }
        };
        checkAndClick();
      } else {
        console.error('Send button not found.');
      }
    } else {
      console.error('Input-area-content not found.');
    }
  }
});
