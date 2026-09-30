export default async function decorate(block) {
  const [quotation, attribution] = [...block.children].map((c) => c.firstElementChild);
  if (!quotation) return;
  const blockquote = document.createElement('blockquote');
  quotation.className = 'quote-quotation';
  blockquote.append(quotation);
  if (attribution) {
    attribution.className = 'quote-attribution';
    blockquote.append(attribution);
    attribution.querySelectorAll('em').forEach((em) => {
      const cite = document.createElement('cite');
      cite.innerHTML = em.innerHTML;
      em.replaceWith(cite);
    });
  }
  block.innerHTML = '';
  block.append(blockquote);
}