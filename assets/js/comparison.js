const ARRANGEMENT_LABELS = Object.freeze({ remote: 'Remote', hybrid: 'Hybrid', office: 'In office' });
const displayValue = (value, format = String) => value == null || (typeof value === 'string' && !value.trim()) ? 'Not provided' : format(value);
const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

export function calculateSalaryDifference(salaryA, salaryB) {
  if (!Number.isFinite(salaryA) || !Number.isFinite(salaryB) || salaryA < 0 || salaryB < 0) {
    throw new TypeError('Annual salaries must be finite, nonnegative numbers.');
  }
  const centsA = Math.round(salaryA * 100);
  const centsB = Math.round(salaryB * 100);
  return {
    higherOffer: centsA === centsB ? null : centsA > centsB ? 'a' : 'b',
    differenceCents: Math.abs(centsA - centsB)
  };
}

function createTableCell(tag, text, scope) {
  const cell = document.createElement(tag);
  cell.textContent = text;
  if (scope) cell.scope = scope;
  return cell;
}

function appendComparisonRow(body, label, valueA, valueB, options = {}) {
  const row = document.createElement('tr');
  if (options.category) {
    row.className = 'comparison-category';
    const heading = createTableCell('th', label, 'row');
    heading.colSpan = 3;
    row.append(heading);
  } else {
    row.append(createTableCell('th', label, 'row'));
    for (const [index, value] of [valueA, valueB].entries()) {
      const cell = createTableCell('td', value);
      cell.dataset.offer = `Offer ${index === 0 ? 'A' : 'B'}`;
      if (options.salary) cell.className = 'salary';
      row.append(cell);
    }
  }
  body.append(row);
}

export function renderComparison(offers, container) {
  const [offerA, offerB] = offers;
  const result = document.createElement('div');
  result.className = 'comparison-result';

  const summary = document.createElement('section');
  summary.className = 'salary-summary';
  const summaryHeading = document.createElement('h3');
  summaryHeading.textContent = 'Annual base-salary difference';
  const summaryText = document.createElement('p');
  if (Number.isFinite(offerA.baseSalary) && Number.isFinite(offerB.baseSalary)) {
    const difference = calculateSalaryDifference(offerA.baseSalary, offerB.baseSalary);
    summaryText.textContent = difference.higherOffer === null
      ? 'The annual base salaries are equal.'
      : `Offer ${difference.higherOffer.toUpperCase()} pays ${currency.format(difference.differenceCents / 100)} more per year in base salary.`;
  } else {
    summaryText.textContent = 'The annual base-salary difference is unavailable until both salaries are provided.';
  }
  summary.append(summaryHeading, summaryText);
  result.append(summary);

  const table = document.createElement('table');
  table.className = 'comparison-table';
  const caption = document.createElement('caption');
  caption.textContent = 'Offer details compared side by side';
  table.append(caption);

  const head = document.createElement('thead');
  const headerRow = document.createElement('tr');
  const fieldHeading = createTableCell('th', 'Offer detail', 'col');
  const offerAHeading = createTableCell('th', 'Offer A', 'col');
  const offerBHeading = createTableCell('th', 'Offer B', 'col');
  offerAHeading.className = 'visually-hidden';
  offerBHeading.className = 'visually-hidden';
  headerRow.append(fieldHeading, offerAHeading, offerBHeading);
  head.append(headerRow);
  table.append(head);

  const body = document.createElement('tbody');
  const rows = [
    ['Company or offer name', offer => displayValue(offer.company)],
    ['Job title', offer => displayValue(offer.role)],
    ['Annual base salary · USD / year', offer => displayValue(offer.baseSalary, value => currency.format(value)), { salary: true }],
    ['Benefits & leave', null, { category: true }],
    ['Healthcare', offer => displayValue(offer.healthcare)],
    ['Retirement match', offer => displayValue(offer.retirementMatch)],
    ['Vacation leave', offer => displayValue(offer.vacationLeave)],
    ['Sick leave', offer => displayValue(offer.sickLeave)],
    ['Personal leave', offer => displayValue(offer.personalLeave)],
    ['Work & growth', null, { category: true }],
    ['Location', offer => displayValue(offer.location)],
    ['Work arrangement', offer => displayValue(offer.workArrangement, value => ARRANGEMENT_LABELS[value] ?? value)],
    ['Office attendance', offer => displayValue(offer.officeAttendance)],
    ['Schedule', offer => displayValue(offer.schedule)],
    ['Overtime', offer => displayValue(offer.overtime)],
    ['Career growth', offer => displayValue(offer.careerGrowth)],
    ['Culture notes', offer => displayValue(offer.cultureNotes)]
  ];
  for (const [label, valueForOffer, options] of rows) {
    if (options?.category) {
      appendComparisonRow(body, label, '', '', options);
    } else {
      appendComparisonRow(body, label, valueForOffer(offerA), valueForOffer(offerB), options);
    }
  }
  table.append(body);
  result.append(table);
  container.replaceChildren(result);
}
