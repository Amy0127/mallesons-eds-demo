/**
 * Location list block — the "Office Locations" index (mirrors the AEM
 * `location` component on /locations): a cream full-bleed band with a centered
 * eyebrow and one collapsible row per country. Expanding a country reveals its
 * offices as a 3-column grid of links.
 *
 * Authored as a DA table:
 *   row 1 (single cell)              -> eyebrow label ("Office Locations")
 *   row N: [country][city][city]...  -> one country + its city cells
 *   last single-cell row (optional)  -> footnote text
 *
 * A city cell renders as a compact link when it contains a direct <a>;
 * otherwise it falls back to a full office entry (title + contact details).
 */
function span(cls) {
  const s = document.createElement('span');
  s.className = cls;
  s.setAttribute('aria-hidden', 'true');
  return s;
}

function buildCity(cell) {
  const city = document.createElement('div');
  city.className = 'con-tab-city';

  const direct = cell.querySelector(':scope > a');
  if (direct) {
    const title = document.createElement('div');
    title.className = 'exp-title exp-cloudOffice';
    direct.append(span('kwm-icon--next'));
    title.append(direct);
    city.append(title);
    return city;
  }

  // full office entry (non AU/SG): title line + contact details
  const heading = cell.querySelector('h2, h3, h4, strong');
  const title = document.createElement('div');
  title.className = 'exp-title';
  title.textContent = heading ? heading.textContent.trim() : '';
  if (title.textContent) city.append(title);

  const cont = document.createElement('div');
  cont.className = 'exp-cont';
  while (cell.firstChild) cont.append(cell.firstChild);
  if (cont.textContent.trim()) city.append(cont);
  return city;
}

function buildTab(row) {
  const cells = [...row.children];

  const tab = document.createElement('div');
  tab.className = 'con-tab';

  const title = document.createElement('h2');
  title.className = 'con-tab-title';
  title.textContent = cells[0].textContent.trim();

  const content = document.createElement('div');
  content.className = 'con-tab-content';

  const exp = document.createElement('div');
  exp.className = 'con-tab-exp';
  cells.slice(1).forEach((cell) => exp.append(buildCity(cell)));
  content.append(exp);

  const check = document.createElement('div');
  check.className = 'check-in';
  check.append(document.createTextNode('Show Less'), span('kwm-icon--fold'));
  content.append(check);

  tab.append(title, content);
  return tab;
}

export default function decorate(block) {
  const con = document.createElement('div');
  con.className = 'con';

  const office = document.createElement('div');
  office.className = 'little-office';

  const textRows = [];

  [...block.children].forEach((row) => {
    if (row.children.length < 2) {
      textRows.push(row.textContent.trim());
      return;
    }
    office.append(buildTab(row));
  });

  // first single-cell row = eyebrow, last = footnote
  if (textRows.length) {
    const eyebrow = document.createElement('div');
    eyebrow.className = 'little-title';
    eyebrow.innerHTML = '<p></p>';
    eyebrow.firstChild.textContent = textRows[0];
    con.append(eyebrow);
  }

  con.append(office);

  if (textRows.length > 1) {
    const note = document.createElement('div');
    note.className = 'little-text';
    note.innerHTML = '<p></p>';
    note.firstChild.textContent = textRows[textRows.length - 1];
    con.append(note);
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
