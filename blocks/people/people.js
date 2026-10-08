/**
 * People block — a grid of people (used for office lawyers, key contacts,
 * authors, media contacts). Each row is one person.
 *
 * Two data modes:
 *  1. Inline (snapshot): the row cells carry image + name/title/location/link.
 *     Self-contained — renders with no external dependency. This is what the
 *     migration bridge writes today.
 *  2. Reference (stage 1+): a cell carries only a person link with a
 *     `data-id` attribute; the block hydrates from /people-index.json.
 *     Enabled automatically when that index exists (see PEOPLE_INDEX).
 *
 * Row shapes accepted:
 *   [image][body]                       -> image + text body
 *   [body]                              -> text-only card
 *   [image][name][role][location][link] -> each field its own cell
 */
const PEOPLE_INDEX = '/people-index.json';
let peopleIndexPromise;

async function loadPeopleIndex() {
  if (!peopleIndexPromise) {
    peopleIndexPromise = fetch(PEOPLE_INDEX)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((j) => {
        const map = new Map();
        (j.data || []).forEach((p) => { if (p.path) map.set(p.path, p); });
        return map;
      })
      .catch(() => new Map());
  }
  return peopleIndexPromise;
}

function buildCard(row) {
  const li = document.createElement('li');
  li.className = 'people-card';

  const cells = [...row.children];
  const imageCell = cells.find((c) => c.querySelector('picture, img'));

  if (imageCell) {
    imageCell.classList.add('people-card-image');
    li.append(imageCell);
  }

  const body = document.createElement('div');
  body.className = 'people-card-body';
  cells.filter((c) => c !== imageCell).forEach((c) => {
    while (c.firstElementChild) body.append(c.firstElementChild);
  });
  li.append(body);

  // classify name / role / location for styling
  const paragraphs = [...body.querySelectorAll('p')];
  if (paragraphs[0]) paragraphs[0].classList.add('people-card-name');
  if (paragraphs[1]) paragraphs[1].classList.add('people-card-role');
  if (paragraphs[2]) paragraphs[2].classList.add('people-card-location');

  const link = body.querySelector('a');
  if (link) {
    link.classList.add('people-card-link');
    li.append(link);
  }
  return li;
}

async function hydrate(cardEl, path) {
  const index = await loadPeopleIndex();
  const person = index.get(path);
  if (!person) return;
  const name = cardEl.querySelector('.people-card-name');
  const role = cardEl.querySelector('.people-card-role');
  const loc = cardEl.querySelector('.people-card-location');
  if (name && person.name) name.textContent = person.name;
  if (role && person.jobTitle) role.textContent = person.jobTitle;
  if (loc && person.office) loc.textContent = person.office;
  const img = cardEl.querySelector('img');
  if (!img && person.image) {
    const pic = document.createElement('picture');
    const el = document.createElement('img');
    el.src = person.image;
    el.alt = person.name || '';
    el.loading = 'lazy';
    pic.append(el);
    cardEl.prepend(pic);
  }
}

export default function decorate(block) {
  const ul = document.createElement('ul');
  ul.className = 'people-list';
  [...block.children].forEach((row) => {
    const card = buildCard(row);
    ul.append(card);
    // stage-1 reference mode
    const ref = row.querySelector('[data-id]');
    if (ref) hydrate(card, ref.getAttribute('data-id'));
  });
  block.replaceChildren(ul);
}
