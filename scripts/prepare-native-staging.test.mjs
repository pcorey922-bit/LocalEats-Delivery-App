import {test} from 'node:test';import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';import {nativeStagingEnvironment,assertNativeStagingReadiness} from './prepare-native-staging.mjs';
const valid={apiOrigin:'https://localeats-delivery-app.onrender.com',clerkPublishableKey:'pk_test_'+Buffer.from('qa.clerk.accounts.dev$').toString('base64')};
test('native staging admits only approved HTTPS and public development configuration',()=>{
 const env=nativeStagingEnvironment(valid);assert.equal(env.VITE_API_ORIGIN,valid.apiOrigin);assert.equal(Object.keys(env).some(k=>/SECRET|PASSWORD|DATABASE/.test(k)),false);
 for(const patch of [{apiOrigin:'https://rocoeats.com'},{apiOrigin:'http://localhost'},{clerkPublishableKey:'sk_test_secret'},{clerkPublishableKey:'pk_live_qa'},{STRIPE_SECRET_KEY:'sk_test_qa'}])assert.throws(()=>nativeStagingEnvironment({...valid,...patch}));
});
test('committed native configuration contains exactly safe public settings',async()=>{nativeStagingEnvironment(JSON.parse(await readFile(new URL('../config/native-staging.json',import.meta.url),'utf8')));});
test('signed app preflight requires explicit closed gates and deployed driver callback capability',()=>{
 const state={nativeProtocolVersion:1,privateTestStaging:true,orderingEnabled:false,publicOrderingEnabled:false,privateTestOrderingEnabled:false,liveChargesEnabled:false,clerkPublishableKey:valid.clerkPublishableKey};
 assertNativeStagingReadiness(state,valid);
 for(const key of ['orderingEnabled','publicOrderingEnabled','privateTestOrderingEnabled','liveChargesEnabled']){
  for(const value of [undefined,null,0,'false',true])assert.throws(()=>assertNativeStagingReadiness({...state,[key]:value},valid));
 }
 assert.throws(()=>assertNativeStagingReadiness(state,valid,'driver'),/Deploy/);
 assert.throws(()=>assertNativeStagingReadiness({...state,nativeAppReturnSchemes:{driver:'rocoeats'}},valid,'driver'),/Deploy/);
 assertNativeStagingReadiness({...state,nativeAppReturnSchemes:{driver:'rocoeats-driver'}},valid,'driver');
});
