// Minimal JOC-15 boundary validation. JOC-36 can extend this shared contract.
import { OFFER_IDS } from './model.js';
export function validateOffers(offers) {
  if (!Array.isArray(offers) || offers.length !== 2 || offers.some((offer, index) => offer?.id !== OFFER_IDS[index])) throw new Error('Expected independent offers a and b.');
  const errors = [];
  for (const offer of offers) {
    for (const [field, title] of [['company', 'company or offer name'], ['role', 'job title']]) {
      const value = offer[field];
      if (typeof value !== 'string' || !value.trim()) errors.push({ id: offer.id, field, message: `Enter a ${title}.` });
      else if (value.length > 120) errors.push({ id: offer.id, field, message: 'Use no more than 120 characters.' });
    }
    const raw = offer.baseSalary;
    const amount = typeof raw === 'string' ? Number(raw.trim()) : NaN;
    if (typeof raw !== 'string' || !raw.trim() || !Number.isFinite(amount) || amount < 0 || amount > Number.MAX_SAFE_INTEGER / 100 || !/^\d+(?:\.\d{1,2})?$/.test(raw.trim())) {
      errors.push({ id: offer.id, field: 'baseSalary', message: 'Enter a nonnegative annual salary using numbers and up to two decimal places.' });
    }
  }
  return { valid: errors.length === 0, errors };
}
export function normalizeOffers(offers) {
  const result = validateOffers(offers);
  if (!result.valid) throw new Error('Cannot normalize invalid offers.');
  return offers.map(offer => ({ ...offer, company: offer.company.trim(), role: offer.role.trim(), baseSalary: Number(offer.baseSalary) }));
}
