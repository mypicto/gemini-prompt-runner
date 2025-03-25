class ClipboardKeywordService {
  constructor(textarea) {
    this.textarea = textarea;
  }

  subscribeToListeners() {
    chrome.runtime.onMessage.addListener(this.handleMessages.bind(this));
  }

  handleMessages(message, sender, sendResponse) {
    if (message.action === "insertClipboardKeyword") {
      this.insertClipboardKeyword();
    }
  }

  insertClipboardKeyword() {
    if (this.textarea && typeof this.textarea.insertTextAtCursor === "function") {
      this.textarea.insertTextAtCursor("{{clipboard}}");
    }
  }
}
