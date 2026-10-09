/**
 * People block — a grid of people (used for office lawyers, key contacts,
 * authors, media contacts).
 *
 * Mode is chosen automatically:
 *  1. AUTO FILTER (default, when the block is authored empty): reads the
 *     current page's `office-id` metadata, fetches /people-index.json and
 *     renders every person whose `office` list contains it. Publishing a new
 *     person page makes them appear with no authoring step.
 *  2. INLINE SNAPSHOT: authored rows carry image + name/role/location/link.
 *  3. REFERENCE: a row/cell with [data-id] is hydrated from /people-index.json.
 *
 * Row shapes accepted (inline): [image][body] / [body] / [image][name][role][location][link]
 */
const PEOPLE_INDEX = '/people-index.json';
let peopleIndexPromise;

function getMeta(name) {
  const el = document.head.querySelector(`meta[name="${name}"]`);
  return el ? el.content.trim() : '';
}

async function loadPeopleIndex() {
  if (!peopleIndexPromise) {
    peopleIndexPromise = fetch(PEOPLE_INDEX)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((j) => j.data || [])
      .catch(() => []);
  }
  return peopleIndexPromise;
}

function cardFromPerson(person) {
  const li = document.createElement('li');
  li.className = 'people-card';

  const imageCell = document.createElement('div');
  imageCell.className = 'people-card-image';
  if (person.image) {
    const pic = document.createElement('picture');
    const img = document.createElement('img');
    img.src = person.image;
    img.alt = person.name || '';
    img.loading = 'lazy';
    pic.append(img);
    imageCell.append(pic);
  }
  li.append(imageCell);

  const body = document.createElement('div');
  body.className = 'people-card-body';
  const name = document.createElement('p');
  name.className = 'people-card-name';
  name.textContent = person.name || '';
  const role = document.createElement('p');
  role.className = 'people-card-role';
  role.textContent = person.jobTitle || '';
  const office = document.createElement('p');
  office.className = 'people-card-location';
  office.textContent = person.officeName || '';
  body.append(name, role, office);
  li.append(body);

  if (person.path) {
    const a = document.createElement('a');
    a.className = 'people-card-link';
    a.href = person.path;
    a.textContent = person.name || 'Profile';
    li.append(a);
  }
  return li;
}

function matchesOffice(person, officeId) {
  if (!officeId) return false;
  const offices = Array.isArray(person.office) ? person.office : [person.office];
  return offices.includes(officeId);
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
  const people = await loadPeopleIndex();
  const person = people.find((p) => p.path === path);
  if (!person) return;
  const name = cardEl.querySelector('.people-card-name');
  const role = cardEl.querySelector('.people-card-role');
  const loc = cardEl.querySelector('.people-card-location');
  if (name && person.name) name.textContent = person.name;
  if (role && person.jobTitle) role.textContent = person.jobTitle;
  if (loc && person.officeName) loc.textContent = person.officeName;
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

export default async function decorate(block) {
  const ul = document.createElement('ul');
  ul.className = 'people-list';

  const rows = [...block.children];
  const hasContent = rows.some((row) => row.children.length > 0 && row.textContent.trim());

  if (hasContent) {
    rows.forEach((row) => {
      if (!row.children.length) return;
      const card = buildCard(row);
      ul.append(card);
      const ref = row.querySelector('[data-id]');
      if (ref) hydrate(card, ref.getAttribute('data-id'));
    });
  } else {
    const officeId = getMeta('office-id');
    const people = (await loadPeopleIndex())
      .filter((p) => matchesOffice(p, officeId))
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    people.forEach((p) => ul.append(cardFromPerson(p)));
  }

  block.replaceChildren(ul);
}