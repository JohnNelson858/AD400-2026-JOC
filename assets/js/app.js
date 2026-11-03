// JOC-13: accessible form UI. JOC-15: controller passes BOTH latest records to validation.
import { createOfferStore, OFFER_IDS, FIELD_NAMES, validateSampleDocument } from './model.js';
import { validateOffers, normalizeOffers } from './validation.js';
import { renderComparison } from './comparison.js';

const store = createOfferStore();
const form = document.querySelector('#offer-form');
const summary = document.querySelector('#error-summary');
const comparison = document.querySelector('#comparison');
const status = document.querySelector('#status-message');
const examplesButton = document.querySelector('#load-examples');
const inputFor = (id, field) => document.getElementById(`offer-${id}-${field}`);

function clearErrors() {
  summary.hidden = true;
  summary.replaceChildren();
  for (const id of OFFER_IDS) for (const field of FIELD_NAMES) {
    inputFor(id, field).removeAttribute('aria-invalid');
    const error = document.getElementById(`offer-${id}-${field}-error`);
    error.textContent = '';
    error.hidden = true;
  }
}
function captureLatestValues() {
  for (const id of OFFER_IDS) for (const field of FIELD_NAMES) store.updateOffer(id, field, inputFor(id, field).value);
}
function invalidatePreview() {
  if (!comparison.hidden) {
    comparison.hidden = true;
    document.querySelector('#comparison-content').replaceChildren();
    status.textContent = 'Offer details changed. Select Compare offers to refresh the preview.';
  }
}
form.addEventListener('input', () => {
  captureLatestValues();
  clearErrors();
  invalidatePreview();
});
form.addEventListener('submit', event => {
  event.preventDefault();
  captureLatestValues(); // Handles autofill and latest DOM values, not just input events.
  clearErrors();
  const offers = store.getOffers();
  const result = validateOffers(offers);
  if (!result.valid) {
    comparison.hidden = true;
    document.querySelector('#comparison-content').replaceChildren();
    status.textContent = '';
    const heading = document.createElement('strong');
    heading.textContent = 'Please check your offer details.';
    const list = document.createElement('ul');
    for (const error of result.errors) {
      const input = inputFor(error.id, error.field);
      input.setAttribute('aria-invalid', 'true');
      const message = document.getElementById(`${input.id}-error`);
      message.textContent = error.message;
      message.hidden = false;
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = `#${input.id}`;
      link.textContent = `Offer ${error.id.toUpperCase()}: ${error.message}`;
      link.addEventListener('click', () => input.focus());
      item.append(link);
      list.append(item);
    }
    summary.append(heading, list);
    summary.hidden = false;
    summary.focus();
    return;
  }
  const normalized = normalizeOffers(offers);
  renderComparison(normalized, document.querySelector('#comparison-content'));
  comparison.hidden = false;
  status.textContent = 'Both offers are ready for review.';
  // Future components can listen without coupling themselves to the form markup.
  document.dispatchEvent(new CustomEvent('joc:offers-ready', { detail: normalized.map(offer => ({ ...offer })) }));
  comparison.focus();
});
examplesButton.addEventListener('click', async () => {
  examplesButton.disabled = true;
  status.textContent = 'Loading fictional examples…';
  try {
    const response = await fetch(new URL('../../data/example-offers.json', import.meta.url), { cache: 'no-store' });
    if (!response.ok) throw new Error('Example data request failed.');
    const sample = validateSampleDocument(await response.json());
    for (const offer of sample.offers) for (const field of FIELD_NAMES) inputFor(offer.id, field).value = String(offer[field]);
    captureLatestValues();
    clearErrors();
    invalidatePreview();
    status.textContent = 'Fictional examples loaded. Select Compare offers to review them.';
  } catch {
    status.textContent = 'Examples could not be loaded. You can still enter both offers manually.';
  } finally { examplesButton.disabled = false; }
});
function resetOnLoad() {
  form.reset();
  store.clear();
  clearErrors();
  comparison.hidden = true;
  document.querySelector('#comparison-content').replaceChildren();
  status.textContent = '';
}
resetOnLoad();
window.addEventListener('pageshow', event => { if (event.persisted) resetOnLoad(); });
examplesButton.disabled = false;
document.querySelector('#compare-button').disabled = false;
