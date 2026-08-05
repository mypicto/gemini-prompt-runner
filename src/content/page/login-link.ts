import { TimeoutError } from '../../shared/async/errors.js';
import { TIMING } from '../../shared/config/timing.js';
import type { ElementLocator } from './element-locator.js';

/** 未ログイン時に表示される Google アカウントのログインリンク */
export class LoginLink {
  constructor(private readonly locator: ElementLocator) {}

  exists(): boolean {
    return this.locator.exists('serviceLoginLink');
  }

  /** @returns クリックできたか。リンク不在 (= ログイン済み) は false で正常 */
  async click(): Promise<boolean> {
    try {
      const link = await this.locator.find('serviceLoginLink', {
        timeoutMs: TIMING.loginLinkLookupTimeoutMs,
      });
      link.click();
      return true;
    } catch (error) {
      if (error instanceof TimeoutError) {
        return false;
      }
      throw error;
    }
  }
}
