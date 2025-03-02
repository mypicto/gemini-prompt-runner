console.log('Content script loaded.');
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM content loaded.');
  function getQueryParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }

  function insertPromptIntoTextarea(prompt) {
    console.log('Inserting prompt into textarea:', prompt);
    const textareaXPath = '/html/body/chat-app/main/side-navigation-v2/mat-sidenav-container/mat-sidenav-content/div/div[2]/chat-window/div/input-container/div/input-area-v2/input-area-content/div/div/div[2]/div/div/rich-textarea/div[1]/p';
    const textareaElement = document.evaluate(textareaXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    
    if (textareaElement) {
      textareaElement.textContent = prompt;
      // textareaElement.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      console.error('Textarea not found.');
    }
  }

  const prompt = getQueryParameter('q');
  console.log('Prompt:', prompt);
  if (prompt && prompt.trim() !== "") {
    // Use MutationObserver to detect when the textarea is added
    const observer = new MutationObserver((mutationsList, observer) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
          const textareaXPath = '/html/body/chat-app/main/side-navigation-v2/mat-sidenav-container/mat-sidenav-content/div/div[2]/chat-window/div/input-container/div/input-area-v2/input-area-content/div/div/div[2]/div/div/rich-textarea/div[1]/p';
          const textareaElement = document.evaluate(textareaXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
          if (textareaElement) {
            insertPromptIntoTextarea(prompt);
            // clickSendButton();
            observer.disconnect(); // Stop observing once the element is found
            break;
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  function clickSendButton() {
    const sendButtonXPath = '/html/body/chat-app/main/side-navigation-v2/mat-sidenav-container/mat-sidenav-content/div/div[2]/chat-window/div/input-container/div/input-area-v2/input-area-content/div/div/div[3]/div/div[2]/button';
    const sendButtonElement = document.evaluate(sendButtonXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    
    if (sendButtonElement) {
        const event = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        });
        sendButtonElement.dispatchEvent(event);
      console.log('Send button clicked.');
    } else {
      console.error('Send button not found.');
    }
  }
});
