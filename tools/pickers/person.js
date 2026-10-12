// eslint-disable-next-line import/no-unresolved
import DA_SDK from 'https://da.live/nx/utils/sdk.js';

const CONNECT_TIMEOUT = 2000;
const DEFAULT_CONTEXT = { org: 'amy0127', site: 'mallesons-eds-demo', ref: 'main' };

const state = {
  sdk: null,
  context: { ...DEFAULT_CONTEXT },
  connected: false,
  people: [],
  filter: '',
};

const els = {
  badge: document.querySelector('#conn-badge'),
  search: document.querySelector('#search'),
  list: document.querySelector('#list'),
  empty: document.querySelector('#empty'),
  status: document.querySelector('#status'),
  close: document.querySelector('#close'),
  getSelection: document.querySelector('#get-selection'),
};

function setStatus(text) {
  els.status.textContent = text;
}

function setBadge() {
  if (state.connected) {
    els.badge.textContent = '已连接 DA 宿主';
    els.badge.classList.remove('off');
    els.badge.classList.add('on');
  } else {
    els.badge.textContent = '独立预览（无宿主）';
    els.badge.classList.add('off');
    els.badge.classList.remove('on');
  }
}

/**
 * People index candidates: same-origin first (works when served from the
 * site origin or the preview proxy), then the absolute preview/live hosts
 * derived from the DA context.
 */
function indexCandidates() {
  const { org, site, ref } = state.context;
  const host = `${ref}--${site}--${org}`;
  return [
    '/people-index.json',
    `https://${host}.aem.page/people-index.json`,
    `https://${host}.aem.live/people-index.json`,
  ];
}

async function tryLoad(url) {
  try {
    const resp = await fetch(url, { credentials: 'omit' });
    if (!resp.ok) return null;
    const json = await resp.json();
    return Array.isArray(json?.data) ? json.data : null;
  } catch {
    return null;
  }
}

async function loadPeople() {
  const results = await Promise.all(indexCandidates().map((url) => tryLoad(url)));
  return results.find((data) => data) || [];
}

function personMatches(person) {
  if (!state.filter) return true;
  const hay = `${person.name} ${person.jobTitle} ${person.officeName}`.toLowerCase();
  return state.filter.split(' ').every((term) => term && hay.includes(term));
}

function insert(person, how) {
  if (!state.sdk?.actions) {
    setStatus('未连接 DA 宿主，无法插入（可打开 harness.html 模拟宿主）');
    return;
  }
  const { actions } = state.sdk;
  if (how === 'sendHTML') {
    const html = `<div><div>author</div><div>${person.path}</div></div>`;
    actions.sendHTML(html);
    setStatus(`已插入 HTML 行（sendHTML）：author | ${person.path}`);
  } else {
    const mode = document.querySelector('input[name="mode"]:checked')?.value;
    const text = mode === 'name' ? person.name : person.path;
    actions.sendText(text);
    setStatus(`已插入（${mode === 'name' ? '姓名' : '路径'}，sendText）：${text}`);
  }
  if (els.close.checked) {
    setTimeout(() => actions.closeLibrary(), 200);
  }
}

function buildPersonItem(person) {
  const li = document.createElement('li');

  const main = document.createElement('button');
  main.type = 'button';
  main.className = 'person';
  main.title = '按当前模式插入（sendText）';

  const avatar = document.createElement('span');
  avatar.className = 'avatar';
  avatar.textContent = (person.name || '?')
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const info = document.createElement('span');
  info.className = 'info';
  const name = document.createElement('span');
  name.className = 'name';
  name.textContent = person.name;
  const meta = document.createElement('span');
  meta.className = 'meta';
  meta.textContent = [person.jobTitle, person.officeName].filter(Boolean).join(' · ');
  info.append(name, meta);
  main.append(avatar, info);
  main.addEventListener('click', () => insert(person, 'sendText'));

  const rowBtn = document.createElement('button');
  rowBtn.type = 'button';
  rowBtn.className = 'row-insert ghost';
  rowBtn.textContent = '+行';
  rowBtn.title = 'sendHTML：插入 author 行（实验）';
  rowBtn.addEventListener('click', () => insert(person, 'sendHTML'));

  li.append(main, rowBtn);
  return li;
}

function renderList() {
  const matches = state.people.filter(personMatches);
  els.list.textContent = '';
  els.empty.hidden = matches.length > 0;
  matches.forEach((person) => els.list.append(buildPersonItem(person)));
}

function wireEvents() {
  els.search.addEventListener('input', () => {
    state.filter = els.search.value.trim().toLowerCase();
    renderList();
  });
  els.search.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const first = state.people.filter(personMatches)[0];
      if (first) insert(first, 'sendText');
    }
  });
  els.getSelection.addEventListener('click', async () => {
    if (!state.sdk?.actions) {
      setStatus('未连接 DA 宿主，无法读取选区');
      return;
    }
    try {
      const html = await state.sdk.actions.getSelection();
      setStatus(`当前选区：${(html || '(空)').slice(0, 160)}`);
    } catch (err) {
      setStatus(`选区读取失败：${err}`);
    }
  });
}

async function init() {
  setBadge();
  wireEvents();

  DA_SDK.then((sdk) => {
    state.sdk = sdk;
    state.connected = true;
    state.context = { ...DEFAULT_CONTEXT, ...(sdk.context || {}) };
    setBadge();
    setStatus('已连接 DA 宿主：点击人员即按当前模式插入');
  });

  setTimeout(() => {
    if (!state.connected) {
      setBadge();
      setStatus('未检测到 DA 宿主 — 独立预览模式（打开 harness.html 可模拟宿主）');
    }
  }, CONNECT_TIMEOUT);

  state.people = await loadPeople();
  renderList();
}

init();
