import { test } from "node:test";
import assert from "node:assert/strict";
import { createDutyIntentStore } from "../../localeats/src/lib/duty-intent";
test("GPS requires explicit intent on each device process and remains isolated by account", () => {
  const s = createDutyIntentStore();
  assert.equal(s.get(null), false);
  assert.equal(s.get("owner"), false);
  s.set("owner", true);
  assert.equal(s.get("owner"), true);
  assert.equal(s.get("other"), false);
  assert.equal(createDutyIntentStore().get("owner"), false);
  s.set("owner", false);
  assert.equal(s.get("owner"), false);
  s.set("owner", true);
  s.set("other", true);
  s.clear();
  assert.equal(s.get("owner"), false);
  assert.equal(s.get("other"), false);
});
test("offline intent updates subscribers synchronously before network persistence", () => {
  const s = createDutyIntentStore();
  s.set("driver", true);
  let observed = true;
  const unsubscribe = s.subscribe(() => {
    observed = s.get("driver");
  });
  s.set("driver", false);
  assert.equal(observed, false);
  unsubscribe();
  s.set("driver", true);
  assert.equal(observed, false);
});

test("location diagnostics never grant tracking intent and are process/account scoped", () => {
 const s=createDutyIntentStore();let notifications=0;const unsubscribe=s.subscribe(()=>notifications++);
 assert.equal(s.status('owner'),'DRIVER_SESSION_NOT_STARTED');
 s.report('owner','DRIVER_READY_NATIVE');assert.equal(s.get('owner'),false);
 assert.equal(s.status('other'),'DRIVER_SESSION_NOT_STARTED');
 s.report('owner','DRIVER_READY_NATIVE');assert.equal(notifications,1);
 assert.equal(createDutyIntentStore().status('owner'),'DRIVER_SESSION_NOT_STARTED');
 s.clear();assert.equal(s.status('owner'),'DRIVER_SESSION_NOT_STARTED');unsubscribe();
});

import {driverAvailabilityResponse,DriverAvailabilityResponseError} from '../../localeats/src/lib/driver-availability';
test("availability rejects incomplete or coerced flags without treating them as revoked driver approval",()=>{
 const valid={approved:true,available:true,online:true,activeOrderId:null};
 assert.deepEqual(driverAvailabilityResponse(valid),valid);
 assert.equal(driverAvailabilityResponse({...valid,approved:false}).approved,false);
 for(const invalid of [undefined,null,'',[],{}, {...valid,approved:undefined},{...valid,approved:'true'}, {...valid,available:1},{...valid,online:'false'},{...valid,activeOrderId:''},{...valid,ownerDriverAccess:'true'}]) {
  assert.throws(()=>driverAvailabilityResponse(invalid),DriverAvailabilityResponseError);
 }
});

test("receipt evidence survives duty stop but never crosses accounts or sign-out",()=>{
 const store=createDutyIntentStore();store.record('driver',{heartbeatAt:123,locationAt:120,failure:'DUTY_ACK_EXPIRED'});store.set('driver',false);
 assert.equal(store.evidence('driver').heartbeatAt,123);assert.equal(store.evidence('other').heartbeatAt,undefined);
 assert.equal(createDutyIntentStore().evidence('driver').heartbeatAt,undefined);store.clear();assert.equal(store.evidence('driver').heartbeatAt,undefined);
});
