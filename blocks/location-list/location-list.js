/**
 * Location list block — the "Office Locations" index (mirrors the AEM
 * `location` component on /locations): a cream full-bleed band with a centered
 * eyebrow and one collapsible row per country. Expanding a country reveals its
 * offices as a grid of links.
 *
 * DATA MODE — fully automatic (default):
 *   The block is authored empty (or with an eyebrow/override row only). It reads
 *   the EDS query index (/query-index.json) and builds the country -> city list
 *   from every published office page that carries `country` / `city` metadata
 *   (see helix-query.yaml). Publishing a new office page makes it appear here
 *   with no authoring step.
 *
 * AUTHOR OVERRIDE (optional, takes precedence when present):
 *   row 1 (single cell)              -> eyebrow label ("Office Locations")
 *   row N: [country][city][city]...  -> one country + its city cells
 *   last single-cell row (optional)  -> footnote text
 *   A city cell renders as a link when it contains a direct <a>.
 */
const QUERY_INDEX = '/query-index.json';
const LOCATION_PREFIX = '/locations/';
let indexPromise;

async function loadLocations() {
  if (!indexPromise) {
    indexPromise = fetch(QUERY_INDEX)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((j) => (j.data || [])
        .filter((row) => row.country && row.path?.startsWith(LOCATION_PREFIX))
        .sort((a, b) => (a.country === b.country
          ? (a.city || '').localeCompare(b.city || '')
          : a.country.localeCompare(b.country))))
      .catch(() => []);
  }
  return indexPromise;
}

function groupByCountry(rows) {
  const groups = [];
  rows.forEach((row) => {
    let group = groups.find((g) => g.name === row.country);
    if (!group) {
      group = { name: row.country, cities: [] };
      groups.push(group);
    }
    group.cities.push({ name: row.city || row.path.split('/').pop(), link: row.path });
  });
  return groups;
}

function span(cls) {
  const s = document.createElement('span');
  s.className = cls;
  s.setAttribute('aria-hidden', 'true');
  return s;
}

function buildCity({ name, link }) {
  const city = document.createElement('div');
  city.className = 'con-tab-city';

  const title = document.createElement('div');
  title.className = 'exp-title';
  if (link) {
    title.classList.add('exp-cloudOffice');
    const a = document.createElement('a');
    a.href = link;
    a.textContent = name;
    a.append(span('kwm-icon--next'));
    title.append(a);
  } else {
    title.textContent = name;
  }
  city.append(title);
  return city;
}

function buildTab(group) {
  const tab = document.createElement('div');
  tab.className = 'con-tab';

  const title = document.createElement('h2');
  title.className = 'con-tab-title';
  title.textContent = group.name;

  const content = document.createElement('div');
  content.className = 'con-tab-content';

  const exp = document.createElement('div');
  exp.className = 'con-tab-exp';
  group.cities.forEach((city) => exp.append(buildCity(city)));
  content.append(exp);

  const check = document.createElement('div');
  check.className = 'check-in';
  check.append(document.createTextNode('Show Less'), span('kwm-icon--fold'));
  content.append(check);

  tab.append(title, content);
  return tab;
}

/* ---- author override (optional authored rows) ---- */
function cell(html) {
  const d = document.createElement('div');
  d.innerHTML = html;
  return d;
}

function authoredGroups(block) {
  const groups = [];
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length < 2) return;
    groups.push({
      name: cells[0].textContent.trim(),
      cities: cells.slice(1).map((c) => {
        const a = c.querySelector('a');
        return a
          ? { name: a.textContent.trim(), link: a.getAttribute('href') }
          : { name: c.textContent.trim(), link: '' };
      }),
    });
  });
  return groups;
}

function buildStructure(block, groups, eyebrow, note) {
  const con = document.createElement('div');
  con.className = 'con';

  if (eyebrow) {
    const el = document.createElement('div');
    el.className = 'little-title';
    el.append(cell(eyebrow).firstChild);
    con.append(el);
  }

  const office = document.createElement('div');
  office.className = 'little-office';
  groups.forEach((group) => office.append(buildTab(group)));
  con.append(office);

  if (note) {
    const el = document.createElement('div');
    el.className = 'little-text';
    el.append(cell(note).firstChild);
    con.append(el);
  }

  const container = document.createElement('div');
  container.className = 'location-container';
  container.append(con);
  block.replaceChildren(container);

  // accordion: clicking a country title opens it (and closes the others)
  block.querySelectorAll('.con-tab-title').forEach((title) => {
    title.addEventListener('click', () => {
      const content = title.nextElementSibling;
      const isOpen = content.classList.contains('is-open');
      block.querySelectorAll('.con-tab-content.is-open').forEach((c) => c.classList.remove('is-open'));
      if (!isOpen) content.classList.add('is-open');
    });
  });

  block.querySelectorAll('.check-in').forEach((btn) => {
    btn.addEventListener('click', () => {
      const content = btn.closest('.con-tab-content');
      if (content) content.classList.remove('is-open');
    });
  });
}

export default async function decorate(block) {
  const textRows = [...block.children]
    .filter((row) => row.children.length < 2)
    .map((row) => row.textContent.trim());

  let groups = authoredGroups(block);
  if (!groups.length) groups = groupByCountry(await loadLocations());

  const eyebrow = textRows[0] || 'Office Locations';
  const note = textRows.length > 1 ? textRows[textRows.length - 1] : '';

  buildStructure(block, groups, eyebrow, note);
}