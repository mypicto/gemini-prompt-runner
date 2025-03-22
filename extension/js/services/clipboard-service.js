class ClipboardService {
  copy(text) {
    return navigator.clipboard.writeText(text);
  }
}
