// Starter handoff for JOC-16 / JOC-20. No difference calculator or overall ranking yet.
// Accepts normalized records, never mutates them, and renders untrusted text safely.
const displayValue = (value, format = String) => value == null || (typeof value === 'string' && !value.trim()) ? 'Not provided' : format(value);

export function renderComparison(offers, container) {
  const currency = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const grid = document.createElement('div');
  grid.className = 'preview-grid';
  for (const offer of offers) {
    const card = document.createElement('article');
    card.className = 'preview-card';
    const entries = [
      ['p', 'preview-label', `Offer ${offer.id.toUpperCase()}`],
      ['h3', '', displayValue(offer.company)],
      ['p', 'salary', displayValue(offer.baseSalary, value => currency.format(value))],
      ['p', 'preview-label', 'Annual base salary · USD / year'],
      ['p', '', displayValue(offer.role)],
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
