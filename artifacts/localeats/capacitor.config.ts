import type { CapacitorConfig } from '@capacitor/cli';
import { appMetadata } from './src/lib/app-audience';
const app = appMetadata(process.env.ROCOEATS_NATIVE_AUDIENCE);
const config: CapacitorConfig = {
  appId: app.id,
  appName: app.name,
  webDir: 'dist/public',
  android: { webContentsDebuggingEnabled: false },
  loggingBehavior: 'none',
};
export default config;
