import { readFile, appendFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
export function nativeStagingEnvironment(config) {
 if(Object.keys(config).sort().join(',')!=='apiOrigin,clerkPublishableKey')throw Error('Only public native settings are permitted');
 if(config.apiOrigin!=='https://localeats-delivery-app.onrender.com')throw Error('Native testing must use the approved staging origin');
 const key=config.clerkPublishableKey;
 if(typeof key!=='string'||!/^pk_test_[A-Za-z0-9+/=_-]+$/.test(key))throw Error('A public Clerk development key is required');
 const host=Buffer.from(key.slice(8),'base64').toString();
 if(!/^[a-z0-9-]+\.clerk\.accounts\.dev\$$/.test(host))throw Error('Invalid Clerk development instance');
 return {VITE_API_ORIGIN:config.apiOrigin,VITE_CLERK_PUBLISHABLE_KEY:key,VITE_NATIVE_STAGING:'true',ROCOEATS_NATIVE_STAGING:'true'};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const env=nativeStagingEnvironment(JSON.parse(await readFile(new URL('../config/native-staging.json',import.meta.url),'utf8')));
 if(process.argv[2]!=='--github-env'||!process.env.GITHUB_ENV)throw Error('Use --github-env within the staging build workflow');
 await appendFile(process.env.GITHUB_ENV,Object.entries(env).map(([k,v])=>`${k}=${v}\n`).join(''));
 console.log('Configured approved HTTPS staging and public Clerk Development settings. No secrets were written.');
}
