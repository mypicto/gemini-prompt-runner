document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp() {
  initManifest();
  initExternalLinks();
  updatePromptUrl();
}

function initManifest() {
  const manifest = chrome.runtime.getManifest();
  document.title = manifest.name;
  document.getElementById('appName').textContent = manifest.name;
  document.getElementById('appVersion').textContent = `ver${manifest.version}`;
}

function initExternalLinks() {
  const externalLinks = document.querySelectorAll('a[target="_blank"]');
  externalLinks.forEach(link => {
    console.log(link);
    link.addEventListener('click', event => {
      event.preventDefault();
      chrome.tabs.create({ url: link.href });
    });
  });
}

function updatePromptUrl() {
  fetch(chrome.runtime.getURL('res/prompt_readme.txt'))
    .then(response => response.text())
    .then(text => {
      const link = document.querySelector('.manual-url a');
      if (!link) return;
      const urlObj = new URL(link.href);
      urlObj.searchParams.set('q', text);
      link.href = urlObj.toString();
    })
    .catch(error => {
      console.error('Failed to fetch prompt URL:', error);
    });
}