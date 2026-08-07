export interface TabsPort {
  create(url: string): Promise<void>;
}

export class ChromeTabs implements TabsPort {
  async create(url: string): Promise<void> {
    await chrome.tabs.create({ url });
  }
}
