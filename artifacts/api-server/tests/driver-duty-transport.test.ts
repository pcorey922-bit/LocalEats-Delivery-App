import test from 'node:test';
import assert from 'node:assert/strict';
import {driverDutyRequest} from '../../localeats/src/lib/driver-duty-transport';
test('duty telemetry renews Clerk once only after definite401 and reuses original body',async()=>{
 let calls=0,renewals=0;const controller=new AbortController();
 const result=await driverDutyRequest(async<T>(_path,options)=>{if(++calls===1)throw{status:401};assert.equal(options.body,'original');assert.equal(new Headers(options.headers).get('Authorization'),'Bearer simulated-fresh-token');return{online:true}as T;},async()=>{renewals++;return'simulated-fresh-token';},'/api/driver/heartbeat',{method:'POST',body:'original',signal:controller.signal});
 assert.deepEqual(result,{online:true});assert.equal(calls,2);assert.equal(renewals,1);
});
test('duty transport never retries network ambiguity, forbidden/expired duty, or nontelemetry writes',async()=>{
 for(const [path,status] of [['/api/driver/heartbeat',403],['/api/driver/heartbeat',409],['/api/driver/heartbeat',503],['/api/driver/heartbeat',undefined],['/api/driver/availability',401],['/api/orders',401]] as const){
  let calls=0,renewals=0;
  await assert.rejects(driverDutyRequest(async()=>{calls++;throw{status};},async()=>{renewals++;return'simulated';},path,{method:'POST',signal:new AbortController().signal}));
  assert.equal(calls,1);assert.equal(renewals,0);
 }
});
test('late token after stop cannot issue any authenticated replay',async()=>{
 const controller=new AbortController();let finish!:(token:string)=>void,calls=0;
 const pending=driverDutyRequest(async()=>{calls++;throw{status:401};},()=>new Promise<string>(resolve=>{finish=resolve;}),'/api/driver/location',{method:'POST',signal:controller.signal});
 await new Promise<void>(resolve=>setImmediate(resolve));controller.abort();finish('simulated');await assert.rejects(pending);assert.equal(calls,1);
});
