// Optional protected Android CLIENT configuration. Never accepts server credentials.
import { readFileSync } from 'node:fs';
import { access, writeFile, appendFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const apps = JSON.parse(readFileSync(new URL('../config/native-audiences.json', import.meta.url), 'utf8'));
const invalid = () => new Error('Invalid Firebase Android client configuration. Check the staging app/project in the protected secret; no values were logged.');
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
function privateMaterial(value) {
  if (typeof value === 'string') return /-----BEGIN[^\n]*PRIVATE KEY-----/.test(value);
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(([key,item]) => /^(?:private_key(?:_id)?|client_secret|access_token|refresh_token)$/i.test(key) || privateMaterial(item));
}
export function firebaseAndroidClient(raw, audience = 'customer') {
  if (!['customer','driver'].includes(audience)) throw invalid();
  if (raw === undefined || raw === '') return null;
  if (typeof raw !== 'string' || raw.length > 1024 * 1024) throw invalid();
  let config;
  try { config = JSON.parse(raw); } catch { throw invalid(); }
  if (!object(config) || privateMaterial(config) || config.type === 'service_account' || config.configuration_version !== '1') throw invalid();
  const project = config.project_info;
  if (!object(project) || typeof project.project_number !== 'string' || typeof project.project_id !== 'string' || !/^[0-9]{4,30}$/.test(project.project_number ?? '') || !/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(project.project_id ?? '') || !Array.isArray(config.client)) throw invalid();
  const packageName = `${apps[audience].id}.staging`;
  const clients = config.client.filter(client => client?.client_info?.android_client_info?.package_name === packageName);
  if (clients.length !== 1) throw invalid();
  const client = clients[0], appId = client.client_info?.mobilesdk_app_id;
  if (typeof appId !== 'string' || !new RegExp(`^1:${project.project_number}:android:[a-fA-F0-9]{16,64}$`).test(appId) || !Array.isArray(client.api_key) || client.api_key.length !== 1 || !/^AIza[A-Za-z0-9_-]{35}$/.test(client.api_key[0]?.current_key ?? '')) throw invalid();
  // Keep only required public Firebase SDK fields for this audience.
  return { project_info: {project_number:project.project_number,project_id:project.project_id},
    client: [{client_info:{mobilesdk_app_id:appId,android_client_info:{package_name:packageName}},api_key:[{current_key:client.api_key[0].current_key}]}], configuration_version:'1' };
}
export function firebaseAndroidSecret(environment, audience) {
  if (!['customer','driver'].includes(audience)) throw invalid();
  return environment[audience === 'driver' ? 'ROCOEATS_FIREBASE_DRIVER_ANDROID_CONFIG_JSON' : 'ROCOEATS_FIREBASE_CUSTOMER_ANDROID_CONFIG_JSON'];
}
export async function prepareFirebaseAndroid(raw, audience, output) {
  const config = firebaseAndroidClient(raw,audience);
  let exists = true;
  try { await access(output); } catch (error) { if (error.code === 'ENOENT') exists = false; else throw error; }
  if (exists) throw new Error('Refusing to overwrite or use an unverified Firebase client file. Use a fresh staging runner.');
  if (!config) return false;
  await writeFile(output, JSON.stringify(config), {mode:0o600,flag:'wx'});
  return true;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const audience = process.env.ROCOEATS_NATIVE_AUDIENCE ?? 'customer';
    const configured = await prepareFirebaseAndroid(firebaseAndroidSecret(process.env,audience),audience,new URL('../artifacts/localeats/android/app/google-services.json',import.meta.url));
    if (process.env.GITHUB_ENV) await appendFile(process.env.GITHUB_ENV,`ROCOEATS_FIREBASE_ANDROID_CONFIGURED=${configured}\n`);
    console.log(`Android Firebase client configured: ${configured}. Provider delivery remains unverified.`);
  } catch {
    console.error('Firebase Android staging preparation failed. Review protected client configuration; no values were logged.');
    process.exitCode = 1;
  }
}
