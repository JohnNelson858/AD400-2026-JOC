// JOC-14: two independent records, held only in memory. No browser storage or API.
// JOC-30: extended with healthcare, retirementMatch, and separate vacation, sick, and personal leave fields.
export const OFFER_IDS = Object.freeze(['a', 'b']);
export const OPTIONAL_OFFER_FIELDS = Object.freeze({
  healthcare: 200,
  retirementMatch: 200,
  vacationLeave: 100,
  sickLeave: 100,
  personalLeave: 100
});
export const FIELD_NAMES = Object.freeze([
  'company',
  'role',
  'baseSalary',
  ...Object.keys(OPTIONAL_OFFER_FIELDS)
]);

export function createEmptyOffer(id) {
  return {
    id,
    company: '',
    role: '',
    baseSalary: '',
    currency: 'USD',
    salaryPeriod: 'year',
    healthcare: '',
    retirementMatch: '',
    vacationLeave: '',
    sickLeave: '',
    personalLeave: ''
  };
}

export function createOfferStore() {
  let offers = OFFER_IDS.map(createEmptyOffer);
  return {
    getOffers: () => offers.map(offer => ({ ...offer })),
    updateOffer(id, field, value) {
      if (!OFFER_IDS.includes(id) || !FIELD_NAMES.includes(field)) throw new Error('Unknown offer or field.');
      if (typeof value !== 'string') throw new TypeError('Form values must be strings.');
      offers = offers.map(offer => offer.id === id ? { ...offer, [field]: value } : offer);
    },
    clear() { offers = OFFER_IDS.map(createEmptyOffer); }
  };
}

// JSON files contain fictional fixtures only. Disallow ambiguous or extra properties.
export function validateSampleDocument(document) {
  if (!document || document.schemaVersion !== 1 || !Array.isArray(document.offers) || document.offers.length !== 2) {
    throw new Error('Use schemaVersion 1 with exactly two offers.');
  }
  if (Object.keys(document).some(key => !['schemaVersion', 'offers'].includes(key))) throw new Error('Unexpected document property.');
  const allowed = ['id', 'currency', 'salaryPeriod', ...FIELD_NAMES];
  document.offers.forEach((offer, index) => {
    if (!offer || offer.id !== OFFER_IDS[index] || Object.keys(offer).some(key => !allowed.includes(key))) throw new Error('Offers must be ordered a, b and use the documented fields.');
    if (offer.currency !== 'USD' || offer.salaryPeriod !== 'year') throw new Error('Use annual USD salaries.');
    for (const field of ['company', 'role']) {
      if (typeof offer[field] !== 'string' || !offer[field].trim() || offer[field].length > 120) throw new Error(`${field} must contain 1–120 characters.`);
    }
    for (const [field, maxLength] of Object.entries(OPTIONAL_OFFER_FIELDS)) {
      if (Object.hasOwn(offer, field) && (typeof offer[field] !== 'string' || offer[field].length > maxLength)) {
        throw new Error(`${field} must be text with at most ${maxLength} characters.`);
      }
    }
    if (typeof offer.baseSalary !== 'number' || !Number.isFinite(offer.baseSalary) || offer.baseSalary < 0 || offer.baseSalary > Number.MAX_SAFE_INTEGER / 100 || Math.abs(offer.baseSalary * 100 - Math.round(offer.baseSalary * 100)) > 0.000001) throw new Error('Salary must be a finite nonnegative amount with at most two decimal places.');
  });
  return document;
}
