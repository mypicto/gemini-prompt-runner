export interface RuntimeInfoPort {
  readonly name: string;
  readonly version: string;
  getURL(path: string): string;
}

export class ChromeRuntimeInfo implements RuntimeInfoPort {
  get name(): string {
    return chrome.runtime.getManifest().name;
  }

  get version(): string {
    return chrome.runtime.getManifest().version;
  }

  getURL(path: string): string {
    return chrome.runtime.getURL(path);
  }
}
