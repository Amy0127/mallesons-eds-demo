/**
 * Location list block — an index of offices grouped by country.
 *
 * Each row is one country:
 *   [country name][office link][office link]...
 * Rows render as a titled group; the office links render as a chip grid.
 * Variant: `location-list cloud` for link-only cloud offices.
 */
export default function decorate(block) {
  const groups = document.createElement('div');
  groups.className = 'location-list-groups';

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const group = document.createElement('div');
    group.className = 'location-list-group';

    // first cell = country heading
    const headingCell = cells[0];
    if (headingCell) {
      const h = document.createElement('h3');
      h.className = 'location-list-country';
      h.textContent = headingCell.textContent.trim();
      group.append(h);
    }

    const items = document.createElement('div');
    items.className = 'location-list-items';
    cells.slice(1).forEach((cell) => {
      const link = cell.querySelector('a');
      const chip = document.createElement('span');
      chip.className = 'location-list-city';
      if (link) chip.append(link);
      else chip.textContent = cell.textContent.trim();
      items.append(chip);
    });
    group.append(items);
    groups.append(group);
  });

  block.replaceChildren(groups);
}
