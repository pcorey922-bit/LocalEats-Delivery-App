// Verify generated native configuration, not provider/device receipt.
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const policy=JSON.parse(await readFile(new URL('../config/native-push-policy.json',import.meta.url),'utf8'));
const apps=JSON.parse(await readFile(new URL('../config/native-audiences.json',import.meta.url),'utf8'));
export function verifyNativePushConfig(config,audience) {
  if(!['customer','driver'].includes(audience)||config?.appId!==apps[audience].id)throw Error('Native push app identity mismatch');
  const options=config?.plugins?.PushNotifications?.presentationOptions;
  if(!Array.isArray(options)||JSON.stringify([...options].sort())!==JSON.stringify([...policy.presentationOptions].sort()))throw Error('Native foreground push presentation is missing or mismatched');
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
  for(const path of ['artifacts/localeats/android/app/src/main/assets/capacitor.config.json','artifacts/localeats/ios/App/App/capacitor.config.json']){
    verifyNativePushConfig(JSON.parse(await readFile(path,'utf8')),process.env.ROCOEATS_NATIVE_AUDIENCE??'customer');
  }
  console.log('Generated customer/driver native notification presentation verified. Provider/device receipt remains unverified.');
}
