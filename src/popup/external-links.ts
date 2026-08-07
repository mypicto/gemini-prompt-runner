import { log } from '../shared/logging.js';
import type { TabsPort } from '../shared/platform/tabs.js';

/**
 * popup 内の外部リンク (a[target="_blank"]) を popup を閉じずに
 * 新規タブで開けるよう、クリックを TabsPort.create に付け替える。
 */
export class ExternalLinks {
  readonly #document: Document;
  readonly #tabs: TabsPort;

  constructor(deps: { document: Document; tabs: TabsPort }) {
    this.#document = deps.document;
    this.#tabs = deps.tabs;
  }

  attach(): void {
    const links = this.#document.querySelectorAll<HTMLAnchorElement>('a[target="_blank"]');
    for (const link of links) {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        void this.#tabs
          .create(link.href)
          .catch((error: unknown) => log.error('Failed to open external link:', error));
      });
    }
  }
}
