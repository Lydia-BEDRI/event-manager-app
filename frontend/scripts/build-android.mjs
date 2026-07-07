import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const envFile = new URL('../.env.android', import.meta.url);

let contents;
try {
  contents = readFileSync(envFile, 'utf8');
} catch {
  console.error('Fichier frontend/.env.android introuvable. Copiez .env.android.example puis configurez-le.');
  process.exit(1);
}

const androidEnv = {};
for (const rawLine of contents.split(/\r?\n/)) {
  const line = rawLine.trim();
  if (!line || line.startsWith('#')) continue;

  const separator = line.indexOf('=');
  if (separator === -1) continue;

  const key = line.slice(0, separator).trim();
  const value = line.slice(separator + 1).trim();
  androidEnv[key] = value;
}

const apiUrl = androidEnv.REACT_APP_API_URL;
try {
  const parsedUrl = new URL(apiUrl);
  if (parsedUrl.protocol !== 'https:' || ['localhost', '127.0.0.1'].includes(parsedUrl.hostname)) {
    throw new Error();
  }
} catch {
  console.error('REACT_APP_API_URL doit être une URL HTTPS absolue vers le VPS, par exemple https://app.example.com/api.');
  process.exit(1);
}

const env = { ...process.env, ...androidEnv };
const commands = [
  ['npm', ['run', 'build']],
  ['npx', ['cap', 'sync', 'android']],
];

for (const [command, args] of commands) {
  const result = spawnSync(command, args, { env, stdio: 'inherit', shell: false });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log(`Build Android synchronisé avec l'API ${apiUrl}`);
