class IconStateService {
  constructor() {
    this.defaultIcon = '../images/icon48.png';
    this.warningIcon = '../images/icon48-warning.png';
    this.isWarningActive = false;

    this.progressIcons = {
      10: '../images/progress10.png',
      20: '../images/progress20.png',
      30: '../images/progress30.png',
      40: '../images/progress40.png',
      50: '../images/progress50.png',
      60: '../images/progress60.png',
      70: '../images/progress70.png',
      80: '../images/progress80.png',
      90: '../images/progress90.png',
      100: '../images/progress100.png'
    };
  }

  #sendToBackground(iconPath) {
    chrome.runtime.sendMessage({ type: 'updateIcon', iconPath: iconPath }, (response) => {
      if (chrome.runtime.lastError) {
        // ブラウザ起動から background script が読み込まれるまでは時間差があるため、異常系も十分に想定される。
      }
    });
  }

  updateProgressIcon(progress) {
    if (this.isWarningActive) return;
    
    const normalizedProgress = Math.round(progress / 10) * 10;
    const progressValue = Math.max(10, Math.min(100, normalizedProgress));
    
    const iconPath = this.progressIcons[progressValue];
    if (iconPath) {
      this.#sendToBackground(iconPath);
    } else {
      console.warn(`Invalid progress value: ${progress}`);
    }
  }

  setWarningIcon() {
    this.isWarningActive = true;
    this.#sendToBackground(this.warningIcon);
  }

  resetToDefault() {
    this.isWarningActive = false;
    this.#sendToBackground(this.defaultIcon);
  }
}