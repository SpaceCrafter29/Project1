// Copies the single-file demo build to demo/olympiad-coach-demo.html.
import { copyFileSync, mkdirSync, statSync } from 'node:fs';

mkdirSync('demo', { recursive: true });
copyFileSync('demo-dist/index.html', 'demo/olympiad-coach-demo.html');
const mb = (statSync('demo/olympiad-coach-demo.html').size / 1024 / 1024).toFixed(1);
console.log(`wrote demo/olympiad-coach-demo.html (${mb} MB) – open it in any browser, no server needed`);
