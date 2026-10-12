/**
 * Host harness: emulates the DA library host side of the protocol
 * implemented in da-live `blocks/edit/da-library/da-library.js`
 * (see also `blocks/canvas/ew-panel-extensions/iframe-protocol.js`).
 */

const iframe = document.querySelector('#picker');
const doc = document.querySelector('#doc');
const logEl = document.querySelector('#log');
const panel = document.querySelector('#panel');
const resetPanel = document.querySelector('#reset-panel');

const project = {
  view: 'edit',
  org: 'amy0127',
  repo: 'mallesons-eds-demo',
  site: 'mallesons-eds-demo',
  ref: 'main',
  path: '/people/harness-doc',
};

let savedRange = null;

function log(dir, text) {
  const time = new Date().toLocaleTimeString();
  logEl.textContent += `[${time}] ${dir} ${text}\n`;
  logEl.scrollTop = logEl.scrollHeight;
}

function post(data, ports) {
  iframe.contentWindow.postMessage(data, '*', ports || []);
}

function saveRange() {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);
  if (doc.contains(range.commonAncestorContainer)) savedRange = range.cloneRange();
}

document.addEventListener('selectionchange', saveRange);

function restoreRange() {
  if (!savedRange) {
    const cells = doc.querySelectorAll('.doc-row .v');
    const cell = cells[cells.length - 1];
    if (!cell) return null;
    const range = document.createRange();
    range.selectNodeContents(cell);
    range.collapse(false);
    savedRange = range;
  }
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(savedRange);
  doc.focus();
  return savedRange;
}

function insertText(text) {
  const range = restoreRange();
  if (!range) {
    log('!', '找不到插入位置（模拟文档不可用）');
    return;
  }
  range.deleteContents();
  range.insertNode(document.createTextNode(text));
  const sel = window.getSelection();
  sel.collapseToEnd();
  saveRange();
}

function insertHTML(html) {
  const range = restoreRange();
  if (!range) {
    log('!', '找不到插入位置（模拟文档不可用）');
    return;
  }
  range.deleteContents();
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  range.insertNode(tpl.content);
  saveRange();
}

function getSelectionHtml() {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
  const range = sel.getRangeAt(0);
  if (!doc.contains(range.commonAncestorContainer)) return null;
  const div = document.createElement('div');
  div.append(range.cloneContents());
  return div.innerHTML;
}

function handleMessage({ action, details }) {
  const detailStr = details === undefined
    ? ''
    : ` :: ${typeof details === 'string' ? details : JSON.stringify(details)}`;
  log('←', `${action}${detailStr}`);
  if (action === 'sendText') {
    insertText(details);
  } else if (action === 'sendHTML') {
    insertHTML(details);
  } else if (action === 'getSelection') {
    const html = getSelectionHtml();
    post({ action: html === null ? 'error' : 'sendSelection', details: html ?? 'No selection found' });
  } else if (action === 'closeLibrary') {
    panel.style.display = 'none';
    resetPanel.hidden = false;
  }
  // setPrompt / showPanel / setHash / setHref: logged only
}

iframe.addEventListener('load', () => {
  log('→', 'iframe 已加载，准备握手');
  const channel = new MessageChannel();
  channel.port1.onmessage = (e) => handleMessage(e.data);
  setTimeout(() => {
    post({
      ready: true, project, context: project, token: '',
    }, [channel.port2]);
    log('→', 'ready 握手已发送（携带 MessagePort + project 上下文）');
  }, 400);
});

document.querySelector('#clear').addEventListener('click', () => {
  doc.querySelectorAll('.doc-row .v').forEach((cell) => { cell.textContent = ''; });
  savedRange = null;
});

resetPanel.addEventListener('click', () => {
  panel.style.display = '';
  resetPanel.hidden = true;
  iframe.contentWindow.location.reload();
});

log('→', 'harness 就绪：等待 iframe 加载');
