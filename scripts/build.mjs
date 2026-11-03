// Publish only the public application, not tests, documentation, or workflow scripts.
import { cp, mkdir, rm } from 'node:fs/promises';
await rm('dist', { recursive:true, force:true });
await mkdir('dist', { recursive:true });
for (const path of ['index.html', 'assets', 'data']) await cp(path, `dist/${path}`, { recursive:true });
console.log('Static site prepared in dist/');
