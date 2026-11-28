import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyNativePushConfig} from './verify-native-push-config.mjs';
const options=['badge','sound','banner','list'];
test('generated native config must pair exact audience identity with visible foreground presentation',()=>{
  for(const audience of ['customer','driver']){
    const appId=audience==='driver'?'com.rocoeats.driver':'com.rocoeats.app';
    verifyNativePushConfig({appId,plugins:{PushNotifications:{presentationOptions:options}}},audience);
    for(const missing of options)assert.throws(()=>verifyNativePushConfig({appId,plugins:{PushNotifications:{presentationOptions:options.filter(v=>v!==missing)}}},audience));
    assert.throws(()=>verifyNativePushConfig({appId,plugins:{}},audience));
    assert.throws(()=>verifyNativePushConfig({appId:'other.app',plugins:{PushNotifications:{presentationOptions:options}}},audience));
  }
});
