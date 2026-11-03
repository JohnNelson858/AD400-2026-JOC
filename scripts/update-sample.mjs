// Authenticated collaborators run this through Actions. Input is data, never shell code.
import { writeFile } from 'node:fs/promises';
import { validateSampleDocument } from '../assets/js/model.js';
const raw = process.env.SAMPLE_JSON;
if (!raw || raw.length > 10000) throw new Error('Supply SAMPLE_JSON containing at most 10,000 characters.');
const document = validateSampleDocument(JSON.parse(raw));
await writeFile('data/example-offers.json', JSON.stringify(document, null, 2) + '\n');
console.log('Validated fictional example data written. No visitor data is involved.');
