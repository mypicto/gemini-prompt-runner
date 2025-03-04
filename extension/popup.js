document.addEventListener('DOMContentLoaded', () => {
  const manifest = chrome.runtime.getManifest();
  document.getElementById('appName').textContent = manifest.name;
  document.getElementById('appVersion').textContent = `ver${manifest.version}`;
});