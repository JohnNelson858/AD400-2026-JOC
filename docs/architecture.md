# Shared architecture and integration contract

## Data flow

1. User edits Offer A or B in `index.html`.
2. `app.js` updates the corresponding record in `createOfferStore()`.
3. Compare re-reads all six inputs, including values supplied by autofill.
4. `validateOffers(offers)` returns `{ valid, errors }`. Errors contain `{ id, field, message }` for the controller's accessible UI.
5. `normalizeOffers(offers)` trims labels and converts valid salary strings into numbers.
6. `renderComparison(offers, container)` presents valid normalized copies. `joc:offers-ready` is dispatched on document with the two records as `event.detail` for later modules.

## Offer contract

Form model: `{ id: 'a' | 'b', company: string, role: string, baseSalary: string, currency: 'USD', salaryPeriod: 'year' }`.

Empty salary is `''`, not zero. Normalized salary is a finite nonnegative **number** with up to two decimal places. Explicit zero is valid. Leading/trailing whitespace in company/role is trimmed at the boundary. Order is always a, b. Snapshots are defensive copies, not the store's mutable internals.

`data/offer-pair.schema.json` describes `{ schemaVersion: 1, offers: [normalizedA, normalizedB] }` for fictional fixtures. `validateSampleDocument` enforces that contract during loading, checks, and automated updates. Update schema, validators, fixtures, and tests together if the team changes the contract. No backend is assumed.

## Component boundaries

| Ticket | Primary files | Extension guidance |
| --- | --- | --- |
| JOC-44 | package.json, scripts/, docs/, .github/ | Agree on starter and run instructions |
| JOC-13 | index.html, assets/css/styles.css | Preserve IDs, labels, descriptions, keyboard focus |
| JOC-14 | assets/js/model.js | Extend records without mixing offers or persisting them |
| JOC-15 | assets/js/app.js | Maintain Compare orchestration and event payload |
| JOC-16 / JOC-20 | assets/js/comparison.js | Extend preview with salary summary and difference calculator |
| JOC-36 | assets/js/validation.js, controller error feedback | Reuse `{ valid, errors }`; extend missing-value rules as optional fields arrive |
| JOC-45 | Complete application | Integrate and test the whole Sprint 1 flow |

Each story includes its own verification. No ticket has been marked Done automatically. Human approval of interfaces is required for JOC-44.

## Privacy and safety

No offer data is written to storage, logged, sent to a server, or auto-committed. All user strings render with `textContent`, not HTML interpolation. Static demo JSON is fetched only on an explicit button click. Do not embed API credentials in frontend files. The authenticated JSON-update action edits only a fictional fixture and accepts data through an environment variable, never by shell interpolation.
