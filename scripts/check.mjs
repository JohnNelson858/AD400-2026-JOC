import { readFile, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { validateSampleDocument } from '../assets/js/model.js';
async function checkDirectory(directory) {
  for (const entry of await readdir(directory, { withFileTypes:true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) await checkDirectory(path);
    else if (/\.(?:js|mjs)$/.test(path)) execFileSync(process.execPath, ['--check', path]);
    else if (path.endsWith('.json')) JSON.parse(await readFile(path, 'utf8'));
  }
}
for (const directory of ['assets', 'data', 'scripts', 'tests']) await checkDirectory(directory);
JSON.parse(await readFile('package.json', 'utf8'));
validateSampleDocument(JSON.parse(await readFile('data/example-offers.json', 'utf8')));
console.log('JavaScript syntax, JSON parsing, and example data are valid.');
