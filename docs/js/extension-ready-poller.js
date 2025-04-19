const EXT_ID = (() => {
  const params = new URLSearchParams(window.location.search);
  return params.get('ext_id') || 'gmjljiibddnjnbllmddpplmnfhcddjmg';
})(); 
const START_TIME = Date.now();
const FAST_INTERVAL = 1000;
const SLOW_INTERVAL = 5000;
const SWITCHOVER_TIME = 10000;

let timeoutId;

function buildTargetUrl() {
  const prefix = '/gemini-prompt-runner/';
  const relativePath = window.location.pathname.slice(prefix.length);
  return `https://gemini.google.com/${relativePath}${window.location.search}${window.location.hash}`;
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