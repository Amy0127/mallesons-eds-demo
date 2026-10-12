/**
 * Related Articles block — lists the articles that reference the current page.
 *
 * Authored empty on an author (person) page. The reverse relation is never
 * stored: the block reads the articles index and keeps the rows whose `author`
 * list contains this page's path. A new article shows up after the index
 * rebuilds (~60-90s) with no authoring step.
 */
const ARTICLES_INDEX = '/articles-index.json';

function selfPath() {
  return window.location.pathname.replace(/\/$/, '');
}

function asArray(value) {
  if (Array.isArray(value)) {
    return value.flatMap((v) => String(v).split(',')).map((s) => s.trim()).filter(Boolean);
  }
  return String(value || '').split(',').map((s) => s.trim()).filter(Boolean);
}

export default async function decorate(block) {
  const self = selfPath();

  let items = [];
  try {
    const resp = await fetch(ARTICLES_INDEX);
    items = resp.ok ? (await resp.json()).data || [] : [];
  } catch (err) {
    items = [];
  }

  const related = items
    .filter((item) => asArray(item.author).includes(self))
    .sort((a, b) => String(b.publishDate || '').localeCompare(String(a.publishDate || '')));

  block.textContent = '';

  if (!related.length) {
    const empty = document.createElement('p');
    empty.className = 'related-articles-empty';
    empty.textContent = 'No articles yet.';
    block.append(empty);
    return;
  }

  const ul = document.createElement('ul');
  ul.className = 'related-articles-list';
  related.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'related-articles-item';

    const link = document.createElement('a');
    link.href = item.path;
    link.textContent = item.title || item.path.split('/').filter(Boolean).pop();
    li.append(link);

    if (item.publishDate) {
      const date = document.createElement('time');
      date.className = 'related-articles-date';
      date.textContent = item.publishDate;
      li.append(date);
    }
    ul.append(li);
  });
  block.append(ul);
}
