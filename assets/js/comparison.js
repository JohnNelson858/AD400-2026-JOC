// Starter handoff for JOC-16 / JOC-20. No difference calculator or overall ranking yet.
// Accepts normalized records, never mutates them, and renders untrusted text safely.
export function renderComparison(offers, container) {
  const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
  const grid = document.createElement('div');
  grid.className = 'preview-grid';
  for (const offer of offers) {
    const card = document.createElement('article');
    card.className = 'preview-card';
    const entries = [
      ['p', 'preview-label', `Offer ${offer.id.toUpperCase()} · annual base salary`],
      ['p', 'salary', currency.format(offer.baseSalary)],
      ['h3', '', offer.company],
      ['p', '', offer.role],
      ['p', 'preview-label', 'USD / year']
    ];
    for (const [tag, className, text] of entries) {
      const element = document.createElement(tag);
      element.className = className;
      element.textContent = text;
      card.append(element);
    }
    grid.append(card);
  }
  container.replaceChildren(grid);
}
