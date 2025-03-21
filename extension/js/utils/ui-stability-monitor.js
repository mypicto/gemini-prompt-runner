class UIStabilityMonitor {
  static async waitForUiStability(interval = 400) {
    return new Promise(resolve => {
      let isStable = false;
      const observer = new MutationObserver((mutations) => {
        isStable = false;
      });
      observer.observe(document.body, { attributes: true, childList: true, subtree: true });
      const checkInterval = setInterval(() => {
        if (isStable) {
          clearInterval(checkInterval);
          observer.disconnect();
          resolve();
        }
        isStable = true;
      }, interval);
    });
  }
}