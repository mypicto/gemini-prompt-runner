document.addEventListener('DOMContentLoaded', () => {
  const manifest = chrome.runtime.getManifest();
  document.title = manifest.name;
  document.getElementById('appName').textContent = manifest.name;
  document.getElementById('appVersion').textContent = `ver${manifest.version}`;
});
