import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'com.rocoeats.app',
  appName: 'RoCoEats',
  webDir: 'dist/public',
  android: { webContentsDebuggingEnabled: false },
  loggingBehavior: 'none',
};
export default config;
