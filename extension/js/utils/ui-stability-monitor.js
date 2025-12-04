export class UIStabilityMonitor {
  /**
   * 単一責任: UI が「使える状態」になるまで待つ。
   * readyCheck が true を返した時点で即終了し、timeoutMs でフェイルセーフ。
   */
  static async waitForUiStability({
    readyCheck = () => true,
    pollIntervalMs = 400,
    timeoutMs = 12000,
  } = {}) {
    return new Promise(resolve => {
      let resolved = false;

      const intervalId = setInterval(() => {
        if (resolved) return;
        let ready = false;
        try {
          ready = !!readyCheck();
        } catch (err) {
          ready = false;
        }

        if (ready) {
          resolved = true;
          clearInterval(intervalId);
          clearTimeout(timeoutId);
          resolve();
        }
      }, pollIntervalMs);

      const timeoutId = setTimeout(() => {
        if (resolved) return;
        resolved = true;
        clearInterval(intervalId);
        resolve();
      }, timeoutMs);
    });
  }
}
