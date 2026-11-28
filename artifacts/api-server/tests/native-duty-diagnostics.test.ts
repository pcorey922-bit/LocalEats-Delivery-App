import test from 'node:test';
import assert from 'node:assert/strict';
import {sanitizeDutyDiagnostics} from '../../localeats/src/lib/native-duty-diagnostics';
import {customFetch,setAuthTokenGetter} from '../../../lib/api-client-react/src/custom-fetch';
test('diagnostic display strips arbitrary native JSON and bounds events/counters',()=>{
 const raw={schema:1,state:'EXPIRED',active:false,elapsedMs:180000,nativeFixAgeMs:40,token:'DO_NOT_LEAK',events:Array.from({length:150},()=>({ms:1,stage:'NATIVE_HTTP_RESULT',kind:'HEARTBEAT',status:200,body:'DO_NOT_LEAK',power:{transport:'DO_NOT_LEAK',ssid:'DO_NOT_LEAK',deviceIdle:true}})),counters:{'NATIVE_HTTP_RESULT.HEARTBEAT':{count:2,lastMs:1000,status:200,headers:'DO_NOT_LEAK'},'DO_NOT_LEAK':{count:1,lastMs:1}},power:{transport:'WIFI',wakeHeld:true,latitude:'DO_NOT_LEAK'}};
 const result=sanitizeDutyDiagnostics(raw);assert.equal(result.events.length,96);assert.equal(result.power.transport,'WIFI');assert.equal(JSON.stringify(result).includes('DO_NOT_LEAK'),false);
 assert.throws(()=>sanitizeDutyDiagnostics({secret:'DO_NOT_LEAK'}),/format could not be verified/);
});
test('request stages expose token/fetch/body progress without forwarding observers or changing transport',async()=>{
 const old=globalThis.fetch;const stages:string[]=[];let finish!:(body:string)=>void;
 setAuthTokenGetter(async()=> 'simulated-token');
 globalThis.fetch=async(_input,options)=>{assert.equal('onStage' in (options??{}),false);return {ok:true,status:200,headers:new Headers({'content-type':'application/json'}),body:null,text:()=>new Promise<string>(resolve=>{finish=resolve;})}as Response;};
 try {
  const result=customFetch('/api/driver/heartbeat',{method:'POST',onStage:stage=>stages.push(stage)});
  await new Promise<void>(resolve=>setImmediate(resolve));
  assert.deepEqual(stages,['TOKEN_START','TOKEN_READY','JS_HTTP_START','JS_HTTP_RETURN','JS_BODY_START']);
  finish('{"online":true}');assert.deepEqual(await result,{online:true});assert.equal(stages.at(-1),'JS_BODY_READY');
  assert.equal(JSON.stringify(stages).includes('simulated-token'),false);
  globalThis.fetch=async()=>Response.json({online:true});
  assert.deepEqual(await customFetch('/api/driver/heartbeat',{onStage:()=>{throw Error('Diagnostic observer failed');}}),{online:true});
 }finally{globalThis.fetch=old;setAuthTokenGetter(null);}
});
