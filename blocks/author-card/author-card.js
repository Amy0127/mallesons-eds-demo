/**
 * Author Card block — renders the article's author(s) with their details.
 *
 * Authored empty; the reference comes from the page metadata:
 *   author: /people/jane-doe          (one author)
 *   author: /people/jane-doe, /people/peter-pan   (several, comma separated)
 *
 * Resolution is at RUNTIME from the site index, so editing an author page
 * (name / title / office / address) updates every article that references
 * them with no re-authoring and no sync — the block never stores a copy.
 */
const PEOPLE_INDEX = '/people-index.json';
let peopleIndexPromise;

function meta(name) {
  const el = document.head.querySelector(`meta[name="${name}"]`);
  return el ? el.content.trim() : '';
}

function authorPaths() {
  return meta('author')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
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

function card(path, person) {
  const li = document.createElement('li');
  li.className = 'author-card';

  const name = document.createElement('p');
  name.className = 'author-card-name';
  const link = document.createElement('a');
  link.href = path;
  link.textContent = (person && person.name) || path.split('/').filter(Boolean).pop();
  name.append(link);

  const parts = [];
  if (person && person.jobTitle) parts.push(person.jobTitle);
  if (person && person.officeName) parts.push(person.officeName);
  if (parts.length) {
    const role = document.createElement('p');
    role.className = 'author-card-role';
    role.textContent = parts.join(' · ');
    li.append(name, role);
  } else {
    li.append(name);
  }

  if (person && person.address) {
    const address = document.createElement('p');
    address.className = 'author-card-address';
    address.textContent = person.address;
    li.append(address);
  }

  return li;
}

export default async function decorate(block) {
  const paths = authorPaths();
  block.textContent = '';
  if (!paths.length) return;

  let people = [];
  try {
    people = await loadPeopleIndex();
  } catch (err) {
    people = [];
  }

  const ul = document.createElement('ul');
  ul.className = 'author-card-list';
  paths.forEach((path) => {
    const person = people.find((p) => p.path === path);
    ul.append(card(path, person));
  });
  block.append(ul);
}
