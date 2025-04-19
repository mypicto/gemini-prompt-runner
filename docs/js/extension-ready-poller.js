const EXT_ID = (() => {
  const params = new URLSearchParams(window.location.search);
  return params.get('ext_id') || 'gmjljiibddnjnbllmddpplmnfhcddjmg';
})(); 
const START_TIME = Date.now();
const FAST_INTERVAL = 1000;
const SLOW_INTERVAL = 5000;
const SWITCHOVER_TIME = 10000;
const PARAM_KEYS = ['ext-q', 'ext-m', 'ext-send', 'ext-clipboard', 'ext-required-login'];

let timeoutId;

function moveParamsToHash(location) {
  const searchParams = new URLSearchParams(location.search);
  const currentHash = location.hash.startsWith('#') ? location.hash.slice(1) : location.hash;
  const hashParams = new URLSearchParams(currentHash);
  
  PARAM_KEYS.forEach(key => {
    if (searchParams.has(key)) {
      hashParams.set(key, searchParams.get(key));
      searchParams.delete(key);
    }
  });
  
  return {
    pathname: location.pathname,
    search: searchParams.toString() ? `?${searchParams.toString()}` : '',
    hash: hashParams.toString() ? `#${hashParams.toString()}` : ''
  };
}

function buildTargetUrl() {
  const prefix = '/gemini-prompt-runner/';
  const relativePath = window.location.pathname.slice(prefix.length);
  const urlParts = moveParamsToHash(window.location);
  
  return `https://gemini.google.com/${relativePath}${urlParts.search}${urlParts.hash}`;
}

function redirectToGemini() {
  window.location.replace(buildTargetUrl());
}

function handlePingResponse(resp) {
  if (chrome.runtime.lastError) {
    scheduleNext();
  } else if (resp && resp.status === 'ALIVE') {
    redirectToGemini();
  } else {
    scheduleNext();
  }
}

function sendPing() {
  chrome.runtime.sendMessage(EXT_ID, { type: 'PING' }, handlePingResponse);
}

function poll() {
  try {
    sendPing();
  } catch (e) {
    scheduleNext();
  }
}

function scheduleNext() {
  const elapsed = Date.now() - START_TIME;
  const nextInterval = elapsed < SWITCHOVER_TIME ? FAST_INTERVAL : SLOW_INTERVAL;
  timeoutId = setTimeout(poll, nextInterval);
}

scheduleNext();