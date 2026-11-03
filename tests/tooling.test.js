import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, copyFile, readFile, access, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const root=resolve('.');
test('JSON updater writes valid input and does not overwrite on invalid input', async () => {
  const cwd=await mkdtemp(join(tmpdir(),'joc-json-'));
  try {
    await mkdir(join(cwd,'data'));
    await copyFile('data/example-offers.json',join(cwd,'data/example-offers.json'));
    const sample=JSON.parse(await readFile(join(cwd,'data/example-offers.json'),'utf8'));
    sample.offers[0].company='Fictional updated company';
    const run=raw=>spawnSync(process.execPath,[join(root,'scripts/update-sample.mjs')],{cwd,env:{...process.env,SAMPLE_JSON:raw},encoding:'utf8'});
    assert.equal(run(JSON.stringify(sample)).status,0);
    const valid=await readFile(join(cwd,'data/example-offers.json'),'utf8');
    assert.equal(JSON.parse(valid).offers[0].company,'Fictional updated company');
    assert.notEqual(run('{bad json').status,0);
    assert.equal(await readFile(join(cwd,'data/example-offers.json'),'utf8'),valid);
    sample.offers[0].baseSalary=-1;
    assert.notEqual(run(JSON.stringify(sample)).status,0);
    assert.equal(await readFile(join(cwd,'data/example-offers.json'),'utf8'),valid);
  } finally { await rm(cwd,{recursive:true,force:true}); }
});
test('build publishes application assets with no workflows or scripts', async () => {
  const result=spawnSync(process.execPath,['scripts/build.mjs'],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  assert.deepEqual((await readdir('dist')).sort(),['assets','data','index.html']);
  await access('dist/assets/js/app.js');
  await access('dist/data/example-offers.json');
});
