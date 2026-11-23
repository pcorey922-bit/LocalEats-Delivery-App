import { readFile, appendFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const audiences = JSON.parse(await readFile(new URL('../config/native-audiences.json', import.meta.url), 'utf8'));

export function nativeAudienceEnvironment(audience = 'customer') {
  if (!['customer', 'driver'].includes(audience)) throw Error('Unknown native app audience');
  const app = audiences[audience];
  return { ROCOEATS_NATIVE_APP_ID: app.id, ROCOEATS_NATIVE_APP_NAME: app.name, ROCOEATS_NATIVE_SCHEME: app.scheme, ROCOEATS_NATIVE_INFO_PLIST: audience === 'driver' ? 'App/Driver-Info.plist' : 'App/Info.plist' };
}
export function driverNativeManifests(android, ios) {
  // Keep customer permissions unchanged; only the driver build includes this
  // generated overlay. Override the upstream exported service to be app-private.
  if (!android.includes('xmlns:tools=')) android = android.replace('<manifest ', '<manifest xmlns:tools="http://schemas.android.com/tools" ');
  android = android.replace('</application>', '<service android:name="com.equimaps.capacitor_background_geolocation.BackgroundGeolocationService" android:exported="false" tools:replace="android:exported"/>\n    </application>');
  // Ticket handoff only: do not add an unused biometric permission or exported
  // SDK OAuth/shared-account entry point to the existing private Driver app.
  android=android.replace('</manifest>', '<uses-permission android:name="android.permission.USE_BIOMETRIC" tools:node="remove"/>\n</manifest>');
  android=android.replace('</application>', '<provider android:name="com.clerk.api.sharedsession.SharedSessionSyncProvider" android:authorities="${applicationId}.clerk.shared-session-sync" android:exported="false" android:enabled="false" tools:replace="android:exported,android:enabled"/><activity android:name="com.clerk.api.sso.SSOReceiverActivity" tools:node="remove"/><activity android:name="com.clerk.api.sso.SSOManagerActivity" tools:node="remove"/>\n</application>');
  const purpose = 'With your consent, RoCoEats Driver shares your location with authorized dispatch and active order participants while on duty, including in the background. Go offline to stop sharing.';
  ios = ios.replace(/(<key>NSLocationWhenInUseUsageDescription<\/key>\s*<string>)[^<]*(<\/string>)/, `$1${purpose}$2`);
  const extra = `<key>NSLocationAlwaysAndWhenInUseUsageDescription</key><string>${purpose}</string><key>UIBackgroundModes</key><array><string>location</string></array>`;
  if (ios.includes('<key>UIBackgroundModes</key>') || ios.includes('<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>')) throw Error('Review existing iOS background declarations before generating driver permissions');
  ios = ios.replace(/<\/dict>\s*<\/plist>\s*$/, `${extra}\n</dict>\n</plist>\n`);
  return { android, ios };
}
async function prepareDriver() {
  const root = new URL('../artifacts/localeats/', import.meta.url);
  const values = driverNativeManifests(await readFile(new URL('android/app/src/main/AndroidManifest.xml', root), 'utf8'), await readFile(new URL('ios/App/App/Info.plist', root), 'utf8'));
  await mkdir(new URL('android/app/src/driver/', root), { recursive: true });
  await writeFile(new URL('android/app/src/driver/AndroidManifest.xml', root), values.android);
  await writeFile(new URL('ios/App/App/Driver-Info.plist', root), values.ios);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!['--github-env', '--prepare'].includes(process.argv[2])) throw Error('Use --prepare or --github-env');
  const values = nativeAudienceEnvironment(process.env.ROCOEATS_NATIVE_AUDIENCE);
  if (process.env.ROCOEATS_NATIVE_AUDIENCE === 'driver') await prepareDriver();
  if (process.argv[2] === '--github-env') {
    if (!process.env.GITHUB_ENV) throw Error('GITHUB_ENV is required');
    await appendFile(process.env.GITHUB_ENV, Object.entries(values).map(([k, v]) => `${k}=${v}\n`).join(''));
  }
  console.log('Prepared public app identity; no credentials or hosted settings changed.');
}
