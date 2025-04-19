function getUiLang() {
  const fallback = 'en';
  return (navigator.language || fallback)
    .toLowerCase()
    .startsWith('ja') ? 'ja' : 'en';
}

async function fetchMessages(uiLang) {
  try {
    const response = await fetch(`/gemini-prompt-runner/i18n/${uiLang}.json`);
    return response.ok ? await response.json() : {};
  } catch {
    return {};
  }
}

function validateMessages(messages) {
  const parser = new DOMParser();
  for (const [key, value] of Object.entries(messages)) {
    const parsedDoc = parser.parseFromString(value, 'text/html');
    if (parsedDoc.body.children.length > 0) {
      throw new Error(`[i18n] Message "${key}" contains HTML tags, which is not allowed.`);
    }
  }
}

function applyMarkup(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

function localizeElements(messages, uiLang) {
  document.documentElement.lang = uiLang;
  for (const el of document.querySelectorAll('[localize]')) {
    const attr = el.getAttribute('localize');
    const key = attr ? attr.trim() : null;
    if (key && messages[key]) {
      el.innerHTML = applyMarkup(messages[key]);
    } else if (key) {
      console.warn(`[i18n] Missing key "${key}" in ${uiLang}.json`);
    }
  }
}

async function initLocalization() {
  const uiLang = getUiLang();
  const messages = await fetchMessages(uiLang);
  validateMessages(messages);
  localizeElements(messages, uiLang);
}

initLocalization();
