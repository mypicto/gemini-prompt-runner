import { TimeoutError } from './errors.js';

export interface WaitOptions {
  timeoutMs: number;
  intervalMs: number;
  /** タイムアウト時のエラーメッセージに載せる「何を待っていたか」の説明 */
  description?: string;
}

type Falsy = false | null | undefined | '' | 0;

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * probe が truthy を返すまでポーリングし、その値を返す。
 * タイムアウトしたら TimeoutError を投げる (失敗が異常であるケース用)。
 */
export async function waitFor<T>(
  probe: () => T | Falsy | Promise<T | Falsy>,
  options: WaitOptions
): Promise<T> {
  const startTime = Date.now();
  do {
    const result = await probe();
    if (result) {
      return result;
    }
    await sleep(options.intervalMs);
  } while (Date.now() - startTime < options.timeoutMs);
  throw new TimeoutError(
    `Timeout: ${options.description ?? 'condition was not met'} (${options.timeoutMs}ms)`
  );
}

/**
 * waitFor のフェイルオープン版。タイムアウトしても throw せず false を返す
 * (「待てるだけ待って続行する」ケース用)。probe の例外・reject は false 扱い。
 */
export async function waitForQuiet(
  probe: () => boolean | Promise<boolean>,
  options: WaitOptions
): Promise<boolean> {
  const startTime = Date.now();
  do {
    let ready = false;
    try {
      ready = await probe();
    } catch {
      ready = false;
    }
    if (ready) {
      return true;
    }
    await sleep(options.intervalMs);
  } while (Date.now() - startTime < options.timeoutMs);
  return false;
}
