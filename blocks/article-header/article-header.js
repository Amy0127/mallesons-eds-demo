/**
 * Article Header block: renders the article's structured metadata.
 * Model field order: title, description, author, publishDate.
 */
function cell(rows, i) {
  return rows[i] ? rows[i].firstElementChild : null;
}

export default function decorate(block) {
  const rows = [...block.children];
  const titleCell = cell(rows, 0);
  const descCell = cell(rows, 1);
  const authorCell = cell(rows, 2);
  const dateCell = cell(rows, 3);

  const inner = document.createElement('div');
  inner.className = 'article-header-inner';

  const title = titleCell ? titleCell.textContent.trim() : '';
  if (title) {
    const h1 = document.createElement('h1');
    h1.className = 'article-header-title';
    h1.textContent = title;
    inner.append(h1);
  }

  const desc = descCell ? descCell.innerHTML.trim() : '';
  if (desc) {
    const standfirst = document.createElement('div');
    standfirst.className = 'article-header-standfirst';
    standfirst.innerHTML = desc;
    inner.append(standfirst);
  }

  const meta = document.createElement('div');
  meta.className = 'article-header-meta';

  if (authorCell) {
    const anchor = authorCell.querySelector('a');
    const raw = (anchor ? anchor.getAttribute('href') : authorCell.textContent).trim();
    let value = anchor ? anchor.textContent.trim() : raw;
    // CF/path references render as their JCR path; show a readable slug instead.
    if (/^\/content\//.test(value)) {
      const slug = value.split('/').filter(Boolean).pop() || '';
      value = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    }
    if (value) {
      const byline = document.createElement('span');
      byline.className = 'article-header-author';
      byline.textContent = value;
      meta.append(byline);
    }
  }

  if (dateCell) {
    const value = dateCell.textContent.trim();
    if (value) {
      const date = document.createElement('time');
      date.className = 'article-header-date';
      date.textContent = value;
      meta.append(date);
    }
  }

  if (meta.childElementCount) inner.append(meta);

  block.replaceChildren(inner);
}
