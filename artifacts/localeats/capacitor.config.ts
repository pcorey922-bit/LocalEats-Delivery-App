import type { CapacitorConfig } from '@capacitor/cli';
import { appMetadata } from './src/lib/app-audience';
const app = appMetadata(process.env.ROCOEATS_NATIVE_AUDIENCE);
const driver = process.env.ROCOEATS_NATIVE_AUDIENCE === 'driver';
const config: CapacitorConfig = {
  appId: app.id,
  appName: app.name,
  webDir: 'dist/public',
  android: { webContentsDebuggingEnabled: false, ...(driver && { useLegacyBridge: true }) },
  includePlugins: ['@capacitor/app', '@capacitor/browser', '@capacitor/geolocation', '@capacitor/push-notifications', ...(driver ? ['@capacitor-community/background-geolocation'] : [])],
  plugins: { CapacitorHttp: { enabled: driver } },
  loggingBehavior: 'none',
};
export default config;
