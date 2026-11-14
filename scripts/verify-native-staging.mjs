import {readFile} from 'node:fs/promises';
import {nativeStagingEnvironment} from './prepare-native-staging.mjs';
const config=JSON.parse(await readFile(new URL('../config/native-staging.json',import.meta.url),'utf8'));
nativeStagingEnvironment(config);
try{
 const r=await fetch(config.apiOrigin+'/api/mobile/readiness',{signal:AbortSignal.timeout(45000)});
 if(!r.ok)throw Error('Deploy the latest mobile backend in Render before creating the installable APK');
 const state=await r.json();
 if(state.nativeProtocolVersion!==1||!state.privateTestStaging||state.orderingEnabled||state.liveChargesEnabled||state.clerkPublishableKey!==config.clerkPublishableKey)throw Error('Staging safety or public Clerk configuration does not match this build');
 for(const origin of ['https://localhost','capacitor://localhost']){
  const c=await fetch(config.apiOrigin+'/api/mobile/readiness',{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':'GET','Access-Control-Request-Headers':'authorization,x-rocoeats-guest-token'},signal:AbortSignal.timeout(30000)});
  if(c.headers.get('access-control-allow-origin')!==origin)throw Error('Native CORS must be deployed before device testing');
 }
 console.log('Verified real HTTPS staging, native contract/CORS, public Clerk match and closed ordering. No order/payment was created.');
}catch(e){console.error(e instanceof Error?e.message:'Native staging verification failed');process.exitCode=1;}
