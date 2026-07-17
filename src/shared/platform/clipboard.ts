export interface ClipboardPort {
  read(): Promise<string>;
  write(text: string): Promise<void>;
}

export class NavigatorClipboard implements ClipboardPort {
  async read(): Promise<string> {
    return navigator.clipboard.readText();
  }

  async write(text: string): Promise<void> {
    await navigator.clipboard.writeText(text);
  }
}
