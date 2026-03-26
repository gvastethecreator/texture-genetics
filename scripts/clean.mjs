import { existsSync, readdirSync, rmSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';

const cwd = process.cwd();
const directoriesToRemove = [
  'dist',
  'coverage',
  '.vite',
  resolve('node_modules', '.vite'),
].map((entry) => resolve(cwd, entry));

for (const directory of directoriesToRemove) {
  if (existsSync(directory)) {
    rmSync(directory, { recursive: true, force: true });
    console.log(`Removed ${directory}`);
  }
}

const logsDirectory = resolve(cwd, 'logs');

if (existsSync(logsDirectory)) {
  for (const entry of readdirSync(logsDirectory)) {
    if (entry.endsWith('.log')) {
      unlinkSync(resolve(logsDirectory, entry));
      console.log(`Removed logs/${entry}`);
    }
  }
}