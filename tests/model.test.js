import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createOfferStore, validateSampleDocument } from '../assets/js/model.js';
import { validateOffers, normalizeOffers } from '../assets/js/validation.js';
const good = () => [{ id:'a', company:' A ', role:' Developer ', baseSalary:'120000', currency:'USD', salaryPeriod:'year' }, { id:'b', company:'B', role:'Engineer', baseSalary:'135000', currency:'USD', salaryPeriod:'year' }];
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
  first.updateOffer('a','baseSalary','42');
  assert.equal(createOfferStore().getOffers()[0].baseSalary,'');
  first.clear();
  assert.ok(first.getOffers().every(o => o.company === '' && o.role === '' && o.baseSalary === ''));
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
