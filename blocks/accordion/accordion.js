import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Accordion block (container): each row = one accordion item, cell[0]=label, cell[1]=body.
 * Uses native <details>/<summary> so it collapses without JS.
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    const [labelCell, bodyCell] = row.children;
    const summary = document.createElement('summary');
    summary.className = 'accordion-item-label';
    if (labelCell) summary.append(...labelCell.childNodes);

    const body = document.createElement('div');
    body.className = 'accordion-item-body';
    if (bodyCell) body.append(...bodyCell.childNodes);

    const details = document.createElement('details');
    details.className = 'accordion-item';
    moveInstrumentation(row, details);
    details.append(summary, body);
    row.replaceWith(details);
  });
}
