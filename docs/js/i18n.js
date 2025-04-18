(async () => {
const fallback = 'en';
const uiLang = (navigator.language || fallback).toLowerCase().startsWith('ja')
             ? 'ja' : 'en';

const messages = await fetch(`./i18n/${uiLang}.json`)
                 .then(r => r.ok ? r.json() : {})
                 .catch(() => ({}));

for (const [key, value] of Object.entries(messages)) {
  const parser = new DOMParser();
  const parsedDoc = parser.parseFromString(value, 'text/html');
  if (parsedDoc.body.children.length > 0) {
    throw new Error(`[i18n] Message "${key}" contains HTML tags, which is not allowed.`);
  }
}

for (const el of document.querySelectorAll('[localize]')) {
  const key = el.textContent.trim();
  if (messages[key]) {
    el.innerHTML = messages[key]
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  } else {
    console.warn(`[i18n] Missing key "${key}" in ${uiLang}.json`);
  }
}

document.documentElement.lang = uiLang;
})();
