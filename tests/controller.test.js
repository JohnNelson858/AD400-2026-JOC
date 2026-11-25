import test from 'node:test';
import assert from 'node:assert/strict';
import { FIELD_NAMES, OFFER_IDS } from '../assets/js/model.js';

class FakeElement {
  constructor(tag = 'div') {
    this.tag = tag;
    this.children = [];
    this.dataset = {};
    this.attributes = new Map();
    this.listeners = new Map();
    this.value = '';
    this.hidden = false;
    this.disabled = false;
    this.className = '';
    this.classList = {
      add: name => this.setClass(name, true),
      remove: name => this.setClass(name, false),
      contains: name => this.className.split(/\s+/).includes(name)
    };
  }
  setClass(name, enabled) {
    const classes = new Set(this.className.split(/\s+/).filter(Boolean));
    if (enabled) classes.add(name);
    else classes.delete(name);
    this.className = [...classes].join(' ');
  }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  addEventListener(type, handler) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(handler);
    this.listeners.set(type, listeners);
  }
  async dispatch(type, event = {}) {
    for (const handler of this.listeners.get(type) ?? []) await handler(event);
  }
  setAttribute(name, value) { this.attributes.set(name, value); }
  removeAttribute(name) { this.attributes.delete(name); }
  closest(selector) {
    if (selector === '.offer-card') return this.offerCard;
    return null;
  }
  focus() { globalThis.document.activeElement = this; }
  set textContent(value) {
    this.children = [];
    this._textContent = String(value);
  }
  get textContent() {
    return this._textContent ?? this.children.map(child => child.textContent).join('');
  }
}

function createControllerDocument() {
  const form = new FakeElement('form');
  const elements = new Map();
  const cards = new Map(OFFER_IDS.map(id => [id, new FakeElement('fieldset')]));
  for (const id of OFFER_IDS) {
    for (const field of FIELD_NAMES) {
      const input = new FakeElement(field === 'workArrangement' ? 'select' : 'input');
      input.id = `offer-${id}-${field}`;
      input.name = `${id}.${field}`;
      input.offerCard = cards.get(id);
      elements.set(input.id, input);
      const error = new FakeElement('p');
      error.id = `${input.id}-error`;
      error.hidden = true;
      elements.set(error.id, error);
    }
  }
  form.querySelectorAll = selector => selector === '.offer-card' ? [...cards.values()] : [];
  form.reset = () => {
    for (const id of OFFER_IDS) {
      for (const field of FIELD_NAMES) elements.get(`offer-${id}-${field}`).value = '';
    }
  };
  const selectors = new Map([
    ['#offer-form', form],
    ['#error-summary', new FakeElement('div')],
    ['#comparison', new FakeElement('section')],
    ['#comparison-content', new FakeElement('div')],
    ['#status-message', new FakeElement('p')],
    ['#load-examples', new FakeElement('button')],
    ['#reset-offers', new FakeElement('button')],
    ['#compare-button', new FakeElement('button')]
  ]);
  return {
    activeElement: null,
    selectors,
    elements,
    querySelector(selector) { return selectors.get(selector); },
    getElementById(id) { return elements.get(id); },
    createElement(tag) { return new FakeElement(tag); },
    dispatchEvent() {}
  };
}

const descendants = (element, predicate) => {
  if (predicate(element)) return element;
  for (const child of element.children) {
    const match = descendants(child, predicate);
    if (match) return match;
  }
  return undefined;
};
const input = (document, id, field) => document.getElementById(`offer-${id}-${field}`);
const comparisonValue = (content, label, offer) => {
  const table = descendants(content, element => element.tag === 'table');
  const body = table.children.find(element => element.tag === 'tbody');
  const row = body.children.find(candidate => candidate.children.some(cell => cell.tag === 'th' && cell.textContent === label));
  return row.children.find(cell => cell.tag === 'td' && cell.dataset.offer === offer).textContent;
};
const editButton = (content, id) => {
  const table = descendants(content, element => element.tag === 'table');
  const body = table.children.find(element => element.tag === 'tbody');
  const row = body.children.find(candidate => candidate.children.some(cell => cell.tag === 'th' && cell.textContent === 'Actions'));
  return row.children.find(cell => cell.dataset.offer === `Offer ${id.toUpperCase()}`).children[0];
};
const fillOffer = (document, id, values) => {
  for (const field of FIELD_NAMES) input(document, id, field).value = values[field] ?? '';
};
const submitForm = document => document.querySelector('#offer-form').dispatch('submit', { preventDefault() {} });
const changeForm = document => document.querySelector('#offer-form').dispatch('input');
const clickEdit = (document, id) => {
  const button = editButton(document.querySelector('#comparison-content'), id);
  return document.querySelector('#comparison-content').dispatch('click', {
    target: { closest: () => button }
  });
};

test('controller compares, edits either offer, revalidates, recomputes, and resets both records', async () => {
  globalThis.document = createControllerDocument();
  globalThis.window = { addEventListener() {} };
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, options) { this.type = type; this.detail = options.detail; }
  };
  try {
    await import('../assets/js/app.js?controller-regression');
    const document = globalThis.document;
    const form = document.querySelector('#offer-form');
    const comparison = document.querySelector('#comparison');
    const content = document.querySelector('#comparison-content');
    const summary = document.querySelector('#error-summary');
    const status = document.querySelector('#status-message');

    fillOffer(document, 'a', {
      company: 'Northstar', role: 'Designer', baseSalary: '120000',
      healthcare: 'PPO', vacationLeave: 'Unlimited PTO', location: 'Seattle',
      workArrangement: 'hybrid', careerGrowth: 'Mentorship'
    });
    fillOffer(document, 'b', {
      company: 'Acme', role: 'Engineer', baseSalary: '135000',
      healthcare: 'HMO', vacationLeave: '15 days', location: 'Portland',
      workArrangement: 'office', cultureNotes: 'Formal reviews'
    });
    await changeForm(document);
    await submitForm(document);
    assert.equal(comparison.hidden, false);
    assert.match(descendants(content, element => element.className === 'salary-summary').textContent, /Offer B pays \$15,000\.00/);

    await clickEdit(document, 'a');
    assert.equal(document.activeElement, input(document, 'a', 'company'));
    assert.equal(input(document, 'a', 'healthcare').value, 'PPO');
    assert.equal(input(document, 'a', 'workArrangement').value, 'hybrid');
    assert.equal(input(document, 'b', 'company').value, 'Acme');
    assert.equal(input(document, 'b', 'baseSalary').value, '135000');
    input(document, 'a', 'baseSalary').value = 'invalid';
    await changeForm(document);
    assert.equal(comparison.hidden, true, 'stale results are hidden immediately after an edit');
    await submitForm(document);
    assert.equal(summary.hidden, false, 'invalid edits are validated again');
    assert.equal(input(document, 'a', 'baseSalary').attributes.get('aria-invalid'), 'true');
    assert.equal(input(document, 'b', 'company').value, 'Acme');

    input(document, 'a', 'baseSalary').value = '140000';
    await changeForm(document);
    await submitForm(document);
    assert.equal(comparison.hidden, false);
    assert.match(descendants(content, element => element.className === 'salary-summary').textContent, /Offer A pays \$5,000\.00/);
    assert.equal(comparisonValue(content, 'Company or offer name', 'Offer B'), 'Acme');
    assert.equal(comparisonValue(content, 'Healthcare', 'Offer B'), 'HMO');

    await clickEdit(document, 'b');
    assert.equal(document.activeElement, input(document, 'b', 'company'));
    assert.equal(input(document, 'b', 'cultureNotes').value, 'Formal reviews');
    assert.equal(input(document, 'a', 'company').value, 'Northstar');
    input(document, 'b', 'company').value = 'Acme Revised';
    input(document, 'b', 'baseSalary').value = '145000';
    await changeForm(document);
    await submitForm(document);
    assert.equal(comparisonValue(content, 'Company or offer name', 'Offer A'), 'Northstar');
    assert.equal(comparisonValue(content, 'Company or offer name', 'Offer B'), 'Acme Revised');
    assert.equal(comparisonValue(content, 'Annual base salary · USD / year', 'Offer A'), '$140,000.00');
    assert.match(descendants(content, element => element.className === 'salary-summary').textContent, /Offer B pays \$5,000\.00/);

    input(document, 'a', 'company').value = ' ';
    await changeForm(document);
    await submitForm(document);
    assert.equal(summary.hidden, false);
    assert.equal(input(document, 'a', 'company').attributes.get('aria-invalid'), 'true');
    await document.querySelector('#reset-offers').dispatch('click');
    assert.equal(comparison.hidden, true);
    assert.equal(content.children.length, 0);
    assert.equal(summary.hidden, true);
    assert.equal(status.textContent, 'Both offers and the comparison are cleared. You can start again.');
    assert.ok(OFFER_IDS.every(id => FIELD_NAMES.every(field => input(document, id, field).value === '')));
    assert.ok(OFFER_IDS.every(id => FIELD_NAMES.every(field => !input(document, id, field).attributes.has('aria-invalid'))));
  } finally {
    delete globalThis.document;
    delete globalThis.window;
    delete globalThis.CustomEvent;
  }
});
