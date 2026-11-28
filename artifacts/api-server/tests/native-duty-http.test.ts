import test from 'node:test';
import assert from 'node:assert/strict';
import {nativeDutyHttp,NativeDutyHttpError} from '../../localeats/src/lib/native-duty-http';
import {driverDutyRequest} from '../../localeats/src/lib/driver-duty-transport';
import {customFetch} from '../../../lib/api-client-react/src/custom-fetch';
const origin='https://localeats-delivery-app.onrender.com';
const options=()=>({method:'POST',signal:new AbortController().signal,nativePulse:{id:'watch',sequence:'1'}});
test('direct native JSON resolves while the legacy synthetic Response body remains pending',async()=>{
 const old=globalThis.fetch;let release!:(text:string)=>void,bodyStarted=false,legacyDone=false;
 globalThis.fetch=async()=>({ok:true,status:200,headers:new Headers({'content-type':'application/json'}),body:null,text:()=>{bodyStarted=true;return new Promise<string>(resolve=>{release=resolve;});}}as Response);
 try{
  const legacy=customFetch('/api/driver/heartbeat').then(value=>{legacyDone=true;return value;});await new Promise<void>(resolve=>setImmediate(resolve));assert.equal(bodyStarted,true);
  const body=await nativeDutyHttp({requestDuty:async request=>{assert.equal(request.headers.authorization,'Bearer simulated-token');return{status:200,data:{online:true},nativeAcknowledged:true};},cancelDutyRequest:async()=>{}},async()=> 'simulated-token',origin,'/api/driver/heartbeat',options());
  assert.deepEqual(body,{online:true});assert.equal(legacyDone,false,'Native path must not await any Fetch body reader');
  release('{"online":true}');await legacy;
 }finally{globalThis.fetch=old;}
});
test('native metadata and strict heartbeat body are both required; server lookalike cannot grant acknowledgement',async()=>{
 for(const response of [{status:200,data:{online:true,nativeAcknowledged:true},nativeAcknowledged:false},{status:200,data:{online:'true'},nativeAcknowledged:true},{status:200,data:null,nativeAcknowledged:true},{status:200,data:'invalid',nativeAcknowledged:true}]){
  await assert.rejects(nativeDutyHttp({requestDuty:async()=>response,cancelDutyRequest:async()=>{}},async()=> 'simulated',origin,'/api/driver/heartbeat',options()),NativeDutyHttpError);
 }
});
test('native telemetry retains one401 renewal and rejects unapproved routes before obtaining credentials',async()=>{
 let calls=0;const tokens:string[]=[];
 const bridge={requestDuty:async request=>{tokens.push(request.headers.authorization);return ++calls===1?{status:401,data:{error:'expired'},nativeAcknowledged:false}:{status:200,data:{online:true},nativeAcknowledged:true};},cancelDutyRequest:async()=>{}};
 const body=await driverDutyRequest((path,request)=>nativeDutyHttp(bridge,async()=> 'simulated-old',origin,path,request),async()=> 'simulated-new','/api/driver/heartbeat',options());
 assert.deepEqual(body,{online:true});assert.deepEqual(tokens,['Bearer simulated-old','Bearer simulated-new']);
 for(const [base,path] of [[origin,'/api/payments'],['https://attacker.example','/api/driver/heartbeat']])await assert.rejects(nativeDutyHttp(bridge,async()=>{throw Error('Must not request token');},base,path,options()),/DUTY_ROUTE_REJECTED/);
});
test('cancellation is forwarded natively and late direct results cannot continue a stopped request',async()=>{
 const controller=new AbortController();let finish!:(value:any)=>void,canceled=0;
 const pending=nativeDutyHttp({requestDuty:()=>new Promise(resolve=>{finish=resolve;}),cancelDutyRequest:async()=>{canceled++;}},async()=> 'simulated',origin,'/api/driver/heartbeat',{...options(),signal:controller.signal});
 await new Promise<void>(resolve=>setImmediate(resolve));controller.abort();finish({status:200,data:{online:true},nativeAcknowledged:true});await assert.rejects(pending);assert.equal(canceled,1);
});
test('native timeout and server5xx remain transient without replaying requests',async()=>{
 for(const value of [{code:'DUTY_REQUEST_TIMEOUT'},{code:'DUTY_REQUEST_FAILED'}]){
  let calls=0;await assert.rejects(nativeDutyHttp({requestDuty:async()=>{calls++;throw value;},cancelDutyRequest:async()=>{}},async()=> 'simulated',origin,'/api/driver/heartbeat',options()),error=>error instanceof NativeDutyHttpError && !error.code.startsWith('DUTY_'));assert.equal(calls,1);
 }
});

test('late Clerk token after native duty expiry cannot initiate heartbeat or fabricate ACK',async()=>{
 let ready!:(value:string)=>void,calls=0;const controller=new AbortController();
 const pending=nativeDutyHttp({requestDuty:async()=>{calls++;return{status:200,data:{online:true},nativeAcknowledged:true};},cancelDutyRequest:async()=>{}},()=>new Promise(resolve=>{ready=resolve;}),origin,'/api/driver/heartbeat',{...options(),signal:controller.signal});
 await new Promise<void>(resolve=>setImmediate(resolve));controller.abort();ready('simulated-late-token');await assert.rejects(pending);assert.equal(calls,0);
});
