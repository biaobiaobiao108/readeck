import { copyFileSync, existsSync, mkdirSync } from 'node:fs';

if (!existsSync('./dist')) {
  mkdirSync('./dist', { recursive: true });
}

copyFileSync('./index.html', './dist/index.html');
console.log('Copied index.html to dist/index.html');
