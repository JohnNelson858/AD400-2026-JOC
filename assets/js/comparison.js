// Starter handoff for JOC-16 / JOC-20.
// JOC-31: displays healthcare, retirement match, and separate leave categories alongside base salary.
// Missing fields display "Not provided" and Unlimited PTO remains descriptive without invented monetary values.
// JOC-35: adds a "Work & growth" list so location, arrangement, schedule, and growth notes sit side by side.
// Text is shown exactly as entered: no scoring or ranking.
const ARRANGEMENT_LABELS = Object.freeze({ remote: 'Remote', hybrid: 'Hybrid', office: 'In office' });
const displayValue = (value, format = String) => value == null || (typeof value === 'string' && !value.trim()) ? 'Not provided' : format(value);

export function renderComparison(offers, container) {
  const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
  const grid = document.createElement('div');
  grid.className = 'preview-grid';
  for (const offer of offers) {
    const card = document.createElement('article');
    card.className = 'preview-card';
    const entries = [
      ['p', 'preview-label', `Offer ${offer.id.toUpperCase()} · annual base salary`],
      ['p', 'salary', displayValue(offer.baseSalary, value => currency.format(value))],
      ['h3', '', displayValue(offer.company)],
      ['p', '', displayValue(offer.role)],
      ['p', 'preview-label', 'USD / year']
    ];
    for (const [tag, className, text] of entries) {
      const element = document.createElement(tag);
      element.className = className;
      element.textContent = text;
      card.append(element);
    }

    const detailsList = document.createElement('dl');
    detailsList.className = 'benefits-leave-list';
    const detailItems = [
      ['Healthcare', displayValue(offer.healthcare)],
      ['Retirement match', displayValue(offer.retirementMatch)],
      ['Vacation leave', displayValue(offer.vacationLeave)],
      ['Sick leave', displayValue(offer.sickLeave)],
      ['Personal leave', displayValue(offer.personalLeave)]
    ];
    for (const [label, text] of detailItems) {
      const dt = document.createElement('dt');
      dt.className = 'preview-label';
      dt.textContent = label;
      const dd = document.createElement('dd');
      dd.textContent = text;
      detailsList.append(dt, dd);
    }
    card.append(detailsList);

    const workHeading = document.createElement('p');
    workHeading.className = 'preview-label work-growth-heading';
    workHeading.textContent = 'Work & growth';
    card.append(workHeading);

    const workList = document.createElement('dl');
    workList.className = 'work-growth-list';
    const workItems = [
      ['Location', displayValue(offer.location)],
      ['Work arrangement', displayValue(offer.workArrangement, value => ARRANGEMENT_LABELS[value] ?? value)],
      ['Office attendance', displayValue(offer.officeAttendance)],
      ['Schedule', displayValue(offer.schedule)],
      ['Overtime', displayValue(offer.overtime)],
      ['Career growth', displayValue(offer.careerGrowth)],
      ['Culture notes', displayValue(offer.cultureNotes)]
    ];
    for (const [label, text] of workItems) {
      const dt = document.createElement('dt');
      dt.className = 'preview-label';
      dt.textContent = label;
      const dd = document.createElement('dd');
      dd.textContent = text;
      workList.append(dt, dd);
    }
    card.append(workList);

    grid.append(card);
  }
  container.replaceChildren(grid);
}
