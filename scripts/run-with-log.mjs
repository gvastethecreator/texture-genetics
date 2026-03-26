import { mkdirSync, createWriteStream } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';

const [, , logFileName, ...rawArgs] = process.argv;

if (!logFileName || rawArgs.length === 0) {
  console.error('Usage: node scripts/run-with-log.mjs <log-file> [--shell <command...> | <command> [args...]]');
  process.exit(1);
}

const logsDir = resolve(process.cwd(), 'logs');
mkdirSync(logsDir, { recursive: true });

const logPath = resolve(logsDir, logFileName);
const logStream = createWriteStream(logPath, { flags: 'w' });
const startedAt = new Date();
const stripAnsi = (value) => value.replace(/\u001b\[[0-9;]*m/g, '');

const header = [
  '# EffectTextureGen log',
  `start: ${startedAt.toISOString()}`,
  `cwd: ${process.cwd()}`,
  `command: ${rawArgs.join(' ')}`,
  '',
].join('\n');

logStream.write(header);

const shellMode = rawArgs[0] === '--shell';
const command = shellMode ? rawArgs.slice(1).join(' ') : rawArgs[0];
const commandArgs = shellMode ? [] : rawArgs.slice(1);

const child = spawn(command, commandArgs, {
  cwd: process.cwd(),
  env: process.env,
  shell: shellMode,
  stdio: ['inherit', 'pipe', 'pipe'],
});

const forwardOutput = (stream, chunk) => {
  stream.write(chunk);
  logStream.write(stripAnsi(chunk.toString()));
};

child.stdout.on('data', (chunk) => forwardOutput(process.stdout, chunk));
child.stderr.on('data', (chunk) => forwardOutput(process.stderr, chunk));

child.on('error', (error) => {
  const message = `\n[runner-error] ${error instanceof Error ? error.stack ?? error.message : String(error)}\n`;
  process.stderr.write(message);
  logStream.write(message);
  logStream.end(() => process.exit(1));
});

child.on('close', (code, signal) => {
  const finishedAt = new Date();
  const footer = [
    '',
    `exitCode: ${code ?? 1}`,
    `signal: ${signal ?? 'none'}`,
    `end: ${finishedAt.toISOString()}`,
    `durationMs: ${finishedAt.getTime() - startedAt.getTime()}`,
    '',
  ].join('\n');

  logStream.write(footer);
  logStream.end(() => process.exit(code ?? 1));
});