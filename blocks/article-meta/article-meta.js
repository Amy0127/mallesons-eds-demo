/**
 * Article Meta block — renders the article's structured data as an eyebrow +
 * byline. The block is authored empty; all values come from the page metadata
 * (the Metadata block at the bottom of the document), which the bridge syncs
 * from the Content Fragment. So a data refresh never touches the body content.
 *
 * Expected page metadata:
 *   article-type, author (repeatable), author-title, publish-date, cf-source
 */
function meta(name) {
  const el = document.head.querySelector(`meta[name="${name}"]`);
  return el ? el.content.trim() : '';
}

function allMeta(name) {
  return [...document.head.querySelectorAll(`meta[name="${name}"]`)]
    .map((el) => el.content.trim())
    .filter(Boolean);
}

export default function decorate(block) {
  const type = meta('article-type');
  const authors = allMeta('author').join(', ');
  const authorTitle = meta('author-title');
  const date = meta('publish-date');
  const source = meta('cf-source');

  const inner = document.createElement('div');
  inner.className = 'article-meta-inner';

  if (type) {
    const eyebrow = document.createElement('p');
    eyebrow.className = 'article-meta-type';
    eyebrow.textContent = type;
    inner.append(eyebrow);
  }

  const parts = [];
  if (authors) parts.push({ cls: 'article-meta-author', text: authors });
  if (authorTitle) parts.push({ cls: 'article-meta-title', text: authorTitle });
  if (date) parts.push({ cls: 'article-meta-date', text: date, isTime: true });

  if (parts.length) {
    const byline = document.createElement('p');
    byline.className = 'article-meta-byline';
    parts.forEach(({ cls, text, isTime }) => {
      const span = document.createElement(isTime ? 'time' : 'span');
      span.className = cls;
      span.textContent = text;
      byline.append(span);
    });
    inner.append(byline);
  }

  if (source) {
    const note = document.createElement('p');
    note.className = 'article-meta-source';
    const slug = source.split('/').filter(Boolean).pop() || source;
    note.textContent = `Structured data synced from Content Fragment: ${slug}`;
    inner.append(note);
  }

  block.replaceChildren(inner);
}