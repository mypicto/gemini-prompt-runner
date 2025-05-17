export class ClipboardService {
  copy(text) {
    return navigator.clipboard.writeText(text);
  }

  async read() {
    return await navigator.clipboard.readText();
  }
}
