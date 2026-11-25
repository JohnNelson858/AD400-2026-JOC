import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { OPTIONAL_OFFER_FIELDS, validateSampleDocument } from '../assets/js/model.js';

test('fictional offer fixtures use the same optional fields and limits as the schema', async () => {
  const schema = JSON.parse(await readFile('data/offer-pair.schema.json', 'utf8'));
  const sample = JSON.parse(await readFile('data/example-offers.json', 'utf8'));
  const offerSchema = schema.$defs.offer;
  assert.equal(validateSampleDocument(sample).offers[0].vacationLeave, 'Unlimited PTO');
  for (const [field, maxLength] of Object.entries(OPTIONAL_OFFER_FIELDS)) {
    assert.deepEqual(offerSchema.properties[field], { type: 'string', maxLength });
    assert.ok(!offerSchema.required.includes(field));
    for (const value of [null, 0, 'x'.repeat(maxLength + 1)]) {
      const invalid = structuredClone(sample);
      invalid.offers[0][field] = value;
      assert.throws(() => validateSampleDocument(invalid), new RegExp(field));
    }
  }
});

test('invalid Compare focuses the first invalid input and a corrected submission preserves optional details', async () => {
  const html = await readFile('index.html', 'utf8');
  let focused;
  const element = (id = '') => ({
    id,
    value: '',
    textContent: '',
    children: [],
    attrs: new Map(),
    handlers: new Map(),
    hidden: false,
    setAttribute(name, value) { this.attrs.set(name, value); },
    removeAttribute(name) { this.attrs.delete(name); },
    replaceChildren(...children) { this.children = children; },
    append(...children) { this.children.push(...children); },
    addEventListener(name, callback) { this.handlers.set(name, callback); },
    focus() { focused = this.id; },
    reset() {}
  });
  const elements = new Map([...html.matchAll(/\bid="([^"]+)"/g)].map(([, id]) => [id, element(id)]));
  const get = id => elements.get(id);
  const previous = { document: globalThis.document, window: globalThis.window };
  globalThis.document = {
    querySelector: selector => get(selector.slice(1)),
    getElementById: get,
    createElement: () => element(),
    dispatchEvent() {}
  };
  globalThis.window = { addEventListener() {} };
  try {
    await import('../assets/js/app.js');
    const put = (id, value) => { get(id).value = value; };
    put('offer-a-company', 'A');
    put('offer-a-baseSalary', '0');
    put('offer-a-vacationLeave', 'Unlimited PTO');
    put('offer-b-company', 'B');
    put('offer-b-role', 'Engineer');
    put('offer-b-baseSalary', '-1');

    let prevented = false;
    const submit = () => get('offer-form').handlers.get('submit')({ preventDefault() { prevented = true; } });
    submit();
    assert.equal(prevented, true);
    assert.equal(focused, 'offer-a-role');
    assert.equal(get(focused).attrs.get('aria-invalid'), 'true');
    assert.match(get('offer-a-role-error').textContent, /job title/i);
    assert.equal(get('error-summary').hidden, false);
    assert.equal(get('comparison').hidden, true);
    assert.equal(get('offer-a-vacationLeave').value, 'Unlimited PTO');

    put('offer-a-role', 'Developer');
    put('offer-b-baseSalary', '135000');
    submit();
    assert.equal(get('error-summary').hidden, true);
    assert.equal(get('offer-a-role').attrs.has('aria-invalid'), false);
    assert.equal(get('comparison').hidden, false);
    assert.equal(focused, 'comparison');
    const [offerA, offerB] = get('comparison-content').children[0].children;
    const texts = node => [node.textContent, ...node.children.flatMap(texts)];
    assert.ok(texts(offerA).includes('$0.00'));
    assert.ok(texts(offerA).includes('Unlimited PTO'));
    assert.ok(texts(offerB).includes('Not provided'));
    assert.ok(!texts(offerB).includes('Unlimited PTO'));
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
    }
  }
});
