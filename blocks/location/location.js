/**
 * Location block — an office's contact details.
 *
 * Row shapes accepted (any order, keyed by content):
 *   [address][contact]                 -> two-column contact info
 *   address cell may contain an <h2> name + rich address HTML
 *   contact cell may contain tel/mailto links and a map link
 *
 * Variant: add `location cloud` for a cloud-office (links-only) entry.
 */
export default function decorate(block) {
  const rows = [...block.children];
  const grid = document.createElement('div');
  grid.className = 'location-grid';

  rows.forEach((row) => {
    const cells = [...row.children];
    const col = document.createElement('div');
    col.className = 'location-col';
    cells.forEach((cell) => {
      while (cell.firstElementChild) col.append(cell.firstElementChild);
    });
    grid.append(col);
  });

  // mark tel / mailto / map links for styling
  grid.querySelectorAll('a').forEach((a) => {
    const href = a.getAttribute('href') || '';
    if (href.startsWith('tel:')) a.classList.add('location-tel');
    else if (href.startsWith('mailto:')) a.classList.add('location-email');
    else if (/maps|mapview|google|goo\.gl/i.test(href)) a.classList.add('location-map');
  });

  block.replaceChildren(grid);
}
