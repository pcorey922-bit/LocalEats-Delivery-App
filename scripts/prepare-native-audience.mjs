import { readFile, appendFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const audiences = JSON.parse(await readFile(new URL('../config/native-audiences.json', import.meta.url), 'utf8'));

export function nativeAudienceEnvironment(audience = 'customer') {
  if (!['customer', 'driver'].includes(audience)) throw Error('Unknown native app audience');
  const app = audiences[audience];
  return { ROCOEATS_NATIVE_APP_ID: app.id, ROCOEATS_NATIVE_APP_NAME: app.name, ROCOEATS_NATIVE_SCHEME: app.scheme };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv[2] !== '--github-env' || !process.env.GITHUB_ENV) throw Error('Use --github-env in CI');
  const values = nativeAudienceEnvironment(process.env.ROCOEATS_NATIVE_AUDIENCE);
  await appendFile(process.env.GITHUB_ENV, Object.entries(values).map(([k, v]) => `${k}=${v}\n`).join(''));
  console.log('Prepared public app identity; no credentials or hosted settings changed.');
}
