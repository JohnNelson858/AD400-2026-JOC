import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createOfferStore, validateSampleDocument, OFFER_IDS, FIELD_NAMES, WORK_ARRANGEMENTS, OPTIONAL_TEXT_FIELDS } from '../assets/js/model.js';
import { validateOffers, normalizeOffers } from '../assets/js/validation.js';
import { calculateSalaryDifference, renderComparison } from '../assets/js/comparison.js';
const good = () => [{ id:'a', company:' A ', role:' Developer ', baseSalary:'120000', currency:'USD', salaryPeriod:'year' }, { id:'b', company:'B', role:'Engineer', baseSalary:'135000', currency:'USD', salaryPeriod:'year' }];
const fakeDocument = () => ({
  createElement(tag) {
    return {
      tag,
      className: '',
      textContent: '',
      children: [],
      dataset: {},
      append(...children) { this.children.push(...children); },
      replaceChildren(child) { this.children = [child]; }
    };
  }
});
const findDescendant = (element, predicate) => {
  if (predicate(element)) return element;
  for (const child of element.children ?? []) {
    const match = findDescendant(child, predicate);
    if (match) return match;
  }
  return undefined;
};
const comparisonTable = container => findDescendant(container, element => element.tag === 'table');
const comparisonRow = (table, label) => table.children
  .find(child => child.tag === 'tbody').children
  .find(row => row.children.some(cell => cell.tag === 'th' && cell.textContent === label));
const comparisonValue = (table, label, offer) => {
  const row = comparisonRow(table, label);
  assert.ok(row, `Missing comparison row: ${label}`);
  return row.children.find(cell => cell.tag === 'td' && cell.dataset.offer === offer)?.textContent;
};
const summaryText = container => {
  const summary = findDescendant(container, element => element.className === 'salary-summary');
  return summary.children[1].textContent;
};
test('each offer card has independent inputs with matching labels and error references', async () => {
  const html = await readFile('index.html', 'utf8');
  const cards = html.match(/<fieldset\b[^>]*>[\s\S]*?<\/fieldset>/g);
  assert.equal(cards.length, 2);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, 'HTML IDs must be unique');
  for (const [index, id] of OFFER_IDS.entries()) {
    for (const field of FIELD_NAMES) {
      const inputId = `offer-${id}-${field}`;
      const input = cards[index].match(new RegExp(`<(?:input|select)\\b[^>]*id="${inputId}"[^>]*>`));
      assert.ok(input, `Missing input in Offer ${id.toUpperCase()}: ${field}`);
      assert.ok(input[0].includes(`name="${id}.${field}"`));
      assert.ok(cards[index].includes(`<label for="${inputId}">`));
      const references = input[0].match(/aria-describedby="([^"]+)"/)[1].split(' ');
      assert.ok(references.includes(`${inputId}-error`));
      for (const reference of references) assert.ok(cards[index].includes(`id="${reference}"`));
    }
  }
});
test('editing one offer preserves the other, with defensive snapshots', () => {
  const store = createOfferStore();
  store.updateOffer('a','company','A');
  store.updateOffer('b','company','B');
  const snapshot = store.getOffers();
  snapshot[0].company = 'changed outside';
  assert.equal(store.getOffers()[0].company,'A');
  assert.equal(store.getOffers()[1].company,'B');
});
test('clear and a fresh store start with independent empty records', () => {
  const first = createOfferStore();
  for (const id of OFFER_IDS) {
    for (const field of FIELD_NAMES) first.updateOffer(id, field, `value-${field}`);
  }
  assert.equal(createOfferStore().getOffers()[0].baseSalary,'');
  first.clear();
  assert.ok(first.getOffers().every(offer => FIELD_NAMES.every(field => offer[field] === '')));
});
test('unknown fields, IDs and non-string input are rejected', () => {
  const store = createOfferStore();
  assert.throws(() => store.updateOffer('c','company','x'));
  assert.throws(() => store.updateOffer('a','currency','EUR'));
  assert.throws(() => store.updateOffer('a','baseSalary',0));
});
test('normalization trims and converts without changing input', () => {
  const offers=good(); const normalized=normalizeOffers(offers);
  assert.equal(normalized[0].company,'A');
  assert.equal(normalized[0].baseSalary,120000);
  assert.equal(offers[0].baseSalary,'120000');
});
for (const value of ['', '-1', 'abc', 'Infinity', '1e4', '120,000', '12.123']) {
  test(`salary ${JSON.stringify(value)} cannot bypass comparison validation`, () => {
    const offers=good();offers[1].baseSalary=value;
    const result=validateOffers(offers);
    assert.equal(result.valid,false);
    assert.ok(result.errors.some(e => e.id==='b' && e.field==='baseSalary'));
    assert.throws(() => normalizeOffers(offers));
  });
}
test('zero and two decimal places are accepted, empty is not zero', () => {
  const offers=good();offers[0].baseSalary='0';offers[1].baseSalary='123.45';
  assert.equal(validateOffers(offers).valid,true);
  assert.equal(normalizeOffers(offers)[0].baseSalary,0);
});
test('both offers use the same required-field and salary rules', () => {
  for (const id of ['a', 'b']) {
    const missingSalary = good();
    delete missingSalary[id === 'a' ? 0 : 1].baseSalary;
    const salaryResult = validateOffers(missingSalary);
    assert.equal(salaryResult.valid, false);
    assert.ok(salaryResult.errors.some(error => error.id === id && error.field === 'baseSalary'));

    const missingCompany = good();
    delete missingCompany[id === 'a' ? 0 : 1].company;
    const companyResult = validateOffers(missingCompany);
    assert.equal(companyResult.valid, false);
    assert.ok(companyResult.errors.some(error => error.id === id && error.field === 'company'));
  }
});
test('optional blank fields do not affect validation', () => {
  const offers = good();
  offers[0].bonus = '';
  offers[1].equity = '   ';
  assert.equal(validateOffers(offers).valid, true);
});
test('comparison displays missing details consistently without treating zero as missing', () => {
  globalThis.document = fakeDocument();
  try {
    const container = { replaceChildren(child) { this.children = [child]; } };
    renderComparison([
      { id: 'a', company: '', role: null, baseSalary: undefined, healthcare: '   ', vacationLeave: 'Unlimited PTO' },
      { id: 'b', company: 'B', role: 'Engineer', baseSalary: 0, healthcare: 'Full PPO coverage', vacationLeave: '15 days' }
    ], container);
    const table = comparisonTable(container);
    assert.equal(comparisonValue(table, 'Company or offer name', 'Offer A'), 'Not provided');
    assert.equal(comparisonValue(table, 'Job title', 'Offer A'), 'Not provided');
    assert.equal(comparisonValue(table, 'Job title', 'Offer B'), 'Engineer');
    assert.equal(comparisonValue(table, 'Annual base salary · USD / year', 'Offer A'), 'Not provided');
    assert.equal(comparisonValue(table, 'Annual base salary · USD / year', 'Offer B'), '$0.00');
    assert.equal(comparisonValue(table, 'Healthcare', 'Offer A'), 'Not provided');
    assert.equal(comparisonValue(table, 'Retirement match', 'Offer A'), 'Not provided');
    assert.equal(comparisonValue(table, 'Vacation leave', 'Offer A'), 'Unlimited PTO');
    assert.equal(comparisonValue(table, 'Healthcare', 'Offer B'), 'Full PPO coverage');
    assert.equal(comparisonValue(table, 'Vacation leave', 'Offer B'), '15 days');
    assert.equal(summaryText(container), 'The annual base-salary difference is unavailable until both salaries are provided.');
  } finally {
    delete globalThis.document;
  }
});
test('comparison aligns corresponding values and keeps qualitative offer details descriptive', () => {
  globalThis.document = fakeDocument();
  try {
    const container = { replaceChildren(child) { this.children = [child]; } };
    renderComparison([
      { id: 'a', company: 'Northstar', role: 'Designer', baseSalary: 120000, healthcare: 'PPO', vacationLeave: 'Unlimited PTO', location: 'Seattle', workArrangement: 'hybrid', careerGrowth: 'Mentorship', bonus: 15000, equity: 'options' },
      { id: 'b', company: 'Acme', role: 'Engineer', baseSalary: 135000.25, healthcare: 'HMO', vacationLeave: '15 days', location: 'Portland', workArrangement: 'office', careerGrowth: 'Learning budget', bonus: 25000, equity: 'shares' }
    ], container);

    const table = comparisonTable(container);
    const rows = table.children.find(child => child.tag === 'tbody').children;
    assert.deepEqual(rows.filter(row => row.children.some(cell => cell.tag === 'td')).map(row => row.children[0].textContent), [
      'Company or offer name', 'Job title', 'Annual base salary · USD / year',
      'Healthcare', 'Retirement match', 'Vacation leave', 'Sick leave', 'Personal leave',
      'Location', 'Work arrangement', 'Office attendance', 'Schedule', 'Overtime', 'Career growth', 'Culture notes'
    ]);
    assert.equal(comparisonValue(table, 'Company or offer name', 'Offer A'), 'Northstar');
    assert.equal(comparisonValue(table, 'Company or offer name', 'Offer B'), 'Acme');
    assert.equal(comparisonValue(table, 'Annual base salary · USD / year', 'Offer A'), '$120,000.00');
    assert.equal(comparisonValue(table, 'Annual base salary · USD / year', 'Offer B'), '$135,000.25');
    assert.equal(comparisonValue(table, 'Healthcare', 'Offer A'), 'PPO');
    assert.equal(comparisonValue(table, 'Healthcare', 'Offer B'), 'HMO');
    assert.equal(comparisonValue(table, 'Work arrangement', 'Offer A'), 'Hybrid');
    assert.equal(comparisonValue(table, 'Work arrangement', 'Offer B'), 'In office');
    assert.match(summaryText(container), /Offer B pays \$15,000\.25 more per year in base salary/);
    assert.ok(!JSON.stringify(container.children).match(/bonus|equity|options|shares/i));
  } finally {
    delete globalThis.document;
  }
});
test('comparison provides an explicit edit action for both independent offers', () => {
  globalThis.document = fakeDocument();
  try {
    const container = { replaceChildren(child) { this.children = [child]; } };
    renderComparison(good().map(offer => ({ ...offer, baseSalary: Number(offer.baseSalary) })), container);
    const table = comparisonTable(container);
    const actionRow = comparisonRow(table, 'Actions');
    const buttons = actionRow.children.filter(child => child.tag === 'td').map(cell => cell.children[0]);
    assert.deepEqual(buttons.map(button => button.textContent), ['Edit Offer A', 'Edit Offer B']);
    assert.deepEqual(buttons.map(button => button.dataset.offerId), ['a', 'b']);
    assert.ok(buttons.every(button => button.type === 'button' && button.dataset.action === 'edit'));
  } finally {
    delete globalThis.document;
  }
});
test('reset control is explicit and cannot submit the offer form', async () => {
  const html = await readFile('index.html', 'utf8');
  assert.match(html, /<button id="reset-offers" type="button"[^>]*>Reset Both Offers<\/button>/);
});
test('salary difference uses exact cents, identifies either higher offer, and reports equality', () => {
  assert.deepEqual(calculateSalaryDifference(120000, 135000.25), { higherOffer: 'b', differenceCents: 1500025 });
  assert.deepEqual(calculateSalaryDifference(135000.25, 120000), { higherOffer: 'a', differenceCents: 1500025 });
  assert.deepEqual(calculateSalaryDifference(95000.55, 95000.55), { higherOffer: null, differenceCents: 0 });
  assert.deepEqual(calculateSalaryDifference(0, 0), { higherOffer: null, differenceCents: 0 });
  assert.throws(() => calculateSalaryDifference(Number.NaN, 1), /finite, nonnegative/);
  assert.throws(() => calculateSalaryDifference(-1, 1), /finite, nonnegative/);
});
test('whitespace required labels fail and retain editable values', () => {
  const offers=good();offers[0].company='   ';offers[1].role='';
  assert.equal(validateOffers(offers).errors.length,2);
  assert.equal(offers[0].company,'   ');
});
test('fixture follows the shared contract and rejects extra fields or wrong order', async () => {
  const sample=JSON.parse(await readFile('data/example-offers.json','utf8'));
  validateSampleDocument(sample);
  const extra=structuredClone(sample);extra.offers[0].token='secret';
  assert.throws(()=>validateSampleDocument(extra));
  const reversed=structuredClone(sample);reversed.offers.reverse();
  assert.throws(()=>validateSampleDocument(reversed));
  const blank=structuredClone(sample);blank.offers[0].company=' ';
  assert.throws(()=>validateSampleDocument(blank));
});

// JOC-32 / JOC-33 / JOC-34 / JOC-35: work arrangement and career growth.
test('work arrangement offers exactly remote, hybrid, and office plus a blank choice', async () => {
  assert.deepEqual([...WORK_ARRANGEMENTS], ['remote', 'hybrid', 'office']);
  const html = await readFile('index.html', 'utf8');
  for (const id of OFFER_IDS) {
    const select = html.match(new RegExp(`<select\\b[^>]*id="offer-${id}-workArrangement"[^>]*>([\\s\\S]*?)</select>`));
    assert.ok(select, `Missing work arrangement select for Offer ${id.toUpperCase()}`);
    const values = [...select[1].matchAll(/value="([^"]*)"/g)].map(match => match[1]);
    assert.deepEqual(values, ['', 'remote', 'hybrid', 'office']);
  }
});
test('work and growth fields are stored separately for each offer', () => {
  const store = createOfferStore();
  store.updateOffer('a', 'workArrangement', 'remote');
  store.updateOffer('a', 'careerGrowth', 'Mentorship');
  store.updateOffer('b', 'workArrangement', 'office');
  const [a, b] = store.getOffers();
  assert.equal(a.workArrangement, 'remote');
  assert.equal(a.careerGrowth, 'Mentorship');
  assert.equal(b.workArrangement, 'office');
  assert.equal(b.careerGrowth, '');
});
test('blank work and growth details are optional and normalize to empty text', () => {
  const offers = good();
  offers[0].location = '   ';
  offers[0].workArrangement = '';
  assert.equal(validateOffers(offers).valid, true);
  const normalized = normalizeOffers(offers);
  assert.equal(normalized[0].location, '');
  assert.equal(normalized[1].cultureNotes, '');
});
test('an unknown work arrangement is rejected for the right offer', () => {
  const offers = good();
  offers[1].workArrangement = 'moon base';
  const result = validateOffers(offers);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.id === 'b' && error.field === 'workArrangement'));
});
test('overly long growth and culture notes are rejected', () => {
  const offers = good();
  offers[0].careerGrowth = 'x'.repeat(301);
  offers[1].cultureNotes = 'y'.repeat(301);
  const result = validateOffers(offers);
  assert.ok(result.errors.some(error => error.id === 'a' && error.field === 'careerGrowth'));
  assert.ok(result.errors.some(error => error.id === 'b' && error.field === 'cultureNotes'));
});
test('qualitative notes are kept exactly as written after trimming', () => {
  const offers = good();
  offers[0].cultureNotes = '  Great team, but long meetings  ';
  offers[0].overtime = ' Unpaid on-call one week a month ';
  const [a] = normalizeOffers(offers);
  assert.equal(a.cultureNotes, 'Great team, but long meetings');
  assert.equal(a.overtime, 'Unpaid on-call one week a month');
});
test('comparison shows work and growth details side by side with Not provided for blanks', () => {
  globalThis.document = fakeDocument();
  try {
    const container = { replaceChildren(child) { this.children = [child]; } };
    renderComparison([
      { id: 'a', company: 'A', role: 'Dev', baseSalary: 1, location: 'Seattle, WA', workArrangement: 'hybrid', officeAttendance: '2 days a week', careerGrowth: 'Mentorship' },
      { id: 'b', company: 'B', role: 'Dev', baseSalary: 1, location: '', workArrangement: '', schedule: '  ', cultureNotes: 'Formal reviews' }
    ], container);
    const table = comparisonTable(container);
    assert.equal(comparisonValue(table, 'Location', 'Offer A'), 'Seattle, WA');
    assert.equal(comparisonValue(table, 'Work arrangement', 'Offer A'), 'Hybrid');
    assert.equal(comparisonValue(table, 'Office attendance', 'Offer A'), '2 days a week');
    assert.equal(comparisonValue(table, 'Career growth', 'Offer A'), 'Mentorship');
    assert.equal(comparisonValue(table, 'Culture notes', 'Offer A'), 'Not provided');
    assert.equal(comparisonValue(table, 'Location', 'Offer B'), 'Not provided');
    assert.equal(comparisonValue(table, 'Work arrangement', 'Offer B'), 'Not provided');
    assert.equal(comparisonValue(table, 'Schedule', 'Offer B'), 'Not provided');
    assert.equal(comparisonValue(table, 'Culture notes', 'Offer B'), 'Formal reviews');
    for (const row of table.children.find(child => child.tag === 'tbody').children) {
      if (row.children.some(cell => cell.tag === 'td')) {
        assert.deepEqual(row.children.filter(cell => cell.tag === 'td').map(cell => cell.dataset.offer), ['Offer A', 'Offer B']);
      }
    }
  } finally {
    delete globalThis.document;
  }
});
test('fixture rejects an unknown work arrangement', async () => {
  const sample = JSON.parse(await readFile('data/example-offers.json', 'utf8'));
  const bad = structuredClone(sample);
  bad.offers[0].workArrangement = 'sometimes';
  assert.throws(() => validateSampleDocument(bad));
});
test('fixture rejects a non-string optional text field', async () => {
  const sample = JSON.parse(await readFile('data/example-offers.json', 'utf8'));
  const bad = structuredClone(sample);
  bad.offers[0].careerGrowth = 123;
  assert.throws(() => validateSampleDocument(bad), /careerGrowth/);
});
test('fixture rejects an optional text field over its limit', async () => {
  const sample = JSON.parse(await readFile('data/example-offers.json', 'utf8'));
  const bad = structuredClone(sample);
  bad.offers[1].careerGrowth = 'x'.repeat(301);
  assert.throws(() => validateSampleDocument(bad), /careerGrowth/);
  const atLimit = structuredClone(sample);
  atLimit.offers[1].careerGrowth = 'x'.repeat(300);
  assert.doesNotThrow(() => validateSampleDocument(atLimit));
});
test('fixture checks type and length for every optional text field and allows omitted ones', async () => {
  const sample = JSON.parse(await readFile('data/example-offers.json', 'utf8'));
  for (const [field, , maxLen] of OPTIONAL_TEXT_FIELDS) {
    const notText = structuredClone(sample);
    notText.offers[0][field] = 42;
    assert.throws(() => validateSampleDocument(notText), new RegExp(field), `${field} should reject non-text`);
    const tooLong = structuredClone(sample);
    tooLong.offers[0][field] = 'x'.repeat(maxLen + 1);
    assert.throws(() => validateSampleDocument(tooLong), new RegExp(field), `${field} should reject more than ${maxLen} characters`);
    const omitted = structuredClone(sample);
    delete omitted.offers[0][field];
    assert.doesNotThrow(() => validateSampleDocument(omitted), `${field} should be optional`);
  }
});
test('validator limits match maxLength in the offer schema', async () => {
  const schema = JSON.parse(await readFile('data/offer-pair.schema.json', 'utf8'));
  for (const [field, , maxLen] of OPTIONAL_TEXT_FIELDS) {
    assert.equal(schema.$defs.offer.properties[field].maxLength, maxLen, `Schema maxLength for ${field}`);
  }
});
test('offer schema lists every field the validator accepts and the same work arrangements', async () => {
  const schema = JSON.parse(await readFile('data/offer-pair.schema.json', 'utf8'));
  const offer = schema.$defs.offer;
  assert.equal(offer.additionalProperties, false);
  assert.deepEqual(
    Object.keys(offer.properties).sort(),
    ['id', 'currency', 'salaryPeriod', ...FIELD_NAMES].sort()
  );
  assert.deepEqual(offer.properties.workArrangement.enum, ['', ...WORK_ARRANGEMENTS]);
  const sample = JSON.parse(await readFile('data/example-offers.json', 'utf8'));
  for (const item of sample.offers) {
    for (const key of Object.keys(item)) assert.ok(key in offer.properties, `Schema is missing ${key}`);
  }
});
