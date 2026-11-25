import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,stat,rm,mkdir,copyFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {firebaseAndroidClient,prepareFirebaseAndroid,firebaseAndroidSecret,verifyFirebaseAndroidProjects} from './prepare-firebase-android.mjs';
const client = audience => ({client_info:{mobilesdk_app_id:'1:123456789012:android:'+'a'.repeat(32),android_client_info:{package_name:`com.rocoeats.${audience==='driver'?'driver':'app'}.staging`}},api_key:[{current_key:'AIza'+'b'.repeat(35)}]});
const fixture = () => ({configuration_version:'1',project_info:{project_number:'123456789012',project_id:'rocoeats-test-project'},client:[client('customer'),client('driver')]});
test('optional absent client config is explicit; customer and driver select only their reviewed staging package',()=>{
  assert.equal(firebaseAndroidClient(undefined,'driver'),null);
  for (const audience of ['customer','driver']) {
    const result=firebaseAndroidClient(JSON.stringify(fixture()),audience);
    assert.equal(result.client.length,1);assert.equal(result.client[0].client_info.android_client_info.package_name,client(audience).client_info.android_client_info.package_name);
  }
  assert.throws(()=>firebaseAndroidClient('', 'admin'));
});
test('reject wrong/duplicate package, mismatched project, malformed key and any server credential without echoing values',()=>{
  const candidates=[{type:'service_account',private_key:'private-fixture'}, {...fixture(),client:[client('customer')]}, {...fixture(),client:[client('driver'),client('driver')]}];
  const mismatch=fixture();mismatch.client[1].client_info.mobilesdk_app_id='1:99999:android:'+'a'.repeat(32);candidates.push(mismatch);
  const invalidKey=fixture();invalidKey.client[1].api_key[0].current_key='private-fixture';candidates.push(invalidKey);
  const hidden=fixture();hidden.client[1].private_key='private-fixture';candidates.push(hidden);
  const production=fixture();production.client[1].client_info.android_client_info.package_name='com.rocoeats.driver';candidates.push(production);
  for (const candidate of candidates) assert.throws(()=>firebaseAndroidClient(JSON.stringify(candidate),'driver'),error=>!error.message.includes('private-fixture')&&!error.message.includes('123456789012'));
  assert.throws(()=>firebaseAndroidClient('{"secret":"private-fixture', 'driver'),error=>!error.message.includes('private-fixture'));
});
test('write only validated private runner file; missing config does not create, existing files never overwritten',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'rocoeats-firebase-client-'));const path=join(dir,'google-services.json');
  try {
    assert.equal(await prepareFirebaseAndroid('', 'driver',path),false);
    await assert.rejects(stat(path),{code:'ENOENT'});
    assert.equal(await prepareFirebaseAndroid(JSON.stringify(fixture()),'driver',path),true);
    assert.equal((await stat(path)).mode&0o777,0o600);
    const before=await readFile(path,'utf8');assert.equal(JSON.parse(before).client.length,1);
    await assert.rejects(prepareFirebaseAndroid(JSON.stringify(fixture()),'driver',path));
    assert.equal(await readFile(path,'utf8'),before);
    await assert.rejects(prepareFirebaseAndroid('', 'driver',path));
  } finally {await rm(dir,{recursive:true,force:true});}
});

test('protected customer and driver inputs are isolated; absent driver never falls back to customer config',()=>{
  const environment={ROCOEATS_FIREBASE_CUSTOMER_ANDROID_CONFIG_JSON:'customer-fixture'};
  assert.equal(firebaseAndroidSecret(environment,'driver'),undefined);
  assert.equal(firebaseAndroidSecret(environment,'customer'),'customer-fixture');
  assert.throws(()=>firebaseAndroidSecret(environment,'admin'));
});


test('provided customer and driver clients must share both project ID and project number',()=>{
 const environment=(customer,driver)=>({ROCOEATS_FIREBASE_CUSTOMER_ANDROID_CONFIG_JSON:JSON.stringify(customer),ROCOEATS_FIREBASE_DRIVER_ANDROID_CONFIG_JSON:JSON.stringify(driver)});
 assert.equal(verifyFirebaseAndroidProjects(environment(fixture(),fixture())),true);
 const otherId=fixture();otherId.project_info.project_id='different-fixture-project';
 assert.throws(()=>verifyFirebaseAndroidProjects(environment(fixture(),otherId)),error=>!error.message.includes('different-fixture-project')&&!error.message.includes('123456789012'));
 const otherNumber=fixture();otherNumber.project_info.project_number='999999999999';for(const entry of otherNumber.client)entry.client_info.mobilesdk_app_id=entry.client_info.mobilesdk_app_id.replace('123456789012','999999999999');
 assert.throws(()=>verifyFirebaseAndroidProjects(environment(fixture(),otherNumber)),error=>!error.message.includes('999999999999'));
});
test('project pairing preserves optional independent setup and permits distinct valid app API keys',()=>{
 assert.equal(verifyFirebaseAndroidProjects({}),false);
 assert.equal(verifyFirebaseAndroidProjects({ROCOEATS_FIREBASE_CUSTOMER_ANDROID_CONFIG_JSON:JSON.stringify(fixture())}),false);
 assert.equal(verifyFirebaseAndroidProjects({ROCOEATS_FIREBASE_DRIVER_ANDROID_CONFIG_JSON:JSON.stringify(fixture())}),false);
 const driver=fixture();driver.client[1].api_key[0].current_key='AIza'+'c'.repeat(35);
 assert.equal(verifyFirebaseAndroidProjects({ROCOEATS_FIREBASE_CUSTOMER_ANDROID_CONFIG_JSON:JSON.stringify(fixture()),ROCOEATS_FIREBASE_DRIVER_ANDROID_CONFIG_JSON:JSON.stringify(driver)}),true);
});

test('packaging rejects mismatched protected inputs before writing client files or CI metadata',async()=>{
 const root=await mkdtemp(join(tmpdir(),'rocoeats-firebase-pair-'));
 try{
  await mkdir(join(root,'scripts'),{recursive:true});await mkdir(join(root,'config'));await mkdir(join(root,'artifacts/localeats/android/app'),{recursive:true});
  const script=join(root,'scripts/prepare-firebase-android.mjs'),output=join(root,'artifacts/localeats/android/app/google-services.json'),metadata=join(root,'environment');
  await copyFile(new URL('./prepare-firebase-android.mjs',import.meta.url),script);await copyFile(new URL('../config/native-audiences.json',import.meta.url),join(root,'config/native-audiences.json'));
  const driver=fixture();driver.project_info.project_id='different-fixture-project';
  const result=spawnSync(process.execPath,[script],{cwd:root,encoding:'utf8',timeout:10000,env:{...process.env,GITHUB_ENV:metadata,ROCOEATS_NATIVE_AUDIENCE:'driver',ROCOEATS_FIREBASE_CUSTOMER_ANDROID_CONFIG_JSON:JSON.stringify(fixture()),ROCOEATS_FIREBASE_DRIVER_ANDROID_CONFIG_JSON:JSON.stringify(driver)}});
  assert.equal(result.status,1);assert.ok(!result.stderr.includes('different-fixture-project'));assert.ok(!result.stderr.includes('123456789012'));
  await assert.rejects(stat(output),{code:'ENOENT'});await assert.rejects(stat(metadata),{code:'ENOENT'});
 }finally{await rm(root,{recursive:true,force:true});}
});
