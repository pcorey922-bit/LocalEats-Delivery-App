export type NativeDutyRequest={requestId:string;url:string;method:string;headers:Record<string,string>;data?:unknown;id?:string;sequence?:string};
export type NativeDutyResponse={status:number;data:unknown;nativeAcknowledged?:boolean};
import { Capacitor, registerPlugin } from '@capacitor/core';
import type { BackgroundGeolocationPlugin } from '@capacitor-community/background-geolocation';
export type DutyTraceKind='NONE'|'HEARTBEAT'|'GPS'|'AVAILABILITY'|'AUTH';
export type DutyJsStage='JS_PULSE'|'JS_GPS'|'TOKEN_START'|'TOKEN_READY'|'TOKEN_FAILED'|'JS_HTTP_START'|'JS_HTTP_RETURN'|'JS_HTTP_FAILED'|'JS_BODY_START'|'JS_BODY_READY';
export const nativeDutyBridge=registerPlugin<BackgroundGeolocationPlugin & {
 requestDuty(options:NativeDutyRequest):Promise<NativeDutyResponse>;
 cancelDutyRequest(options:{requestId:string}):Promise<void>;
 acknowledgeDuty(options:{id:string;sequence:string}):Promise<void>;
 recordDutyStage(options:{id:string;stage:DutyJsStage;kind:DutyTraceKind}):Promise<void>;
 getDutyDiagnostics():Promise<unknown>;
 clearDutyDiagnostics():Promise<void>;
}>('BackgroundGeolocation');
export function recordDutyStage(id:string|undefined,stage:DutyJsStage,kind:DutyTraceKind) {
 if(!id||Capacitor.getPlatform()!=='android')return;
 try{void nativeDutyBridge.recordDutyStage({id,stage,kind}).catch(()=>{});}catch{/* Diagnostic support never changes duty execution. */}
}

const stages=new Set(['START','STOPPED','EXPIRED','PULSE','NATIVE_GPS_FIX','JS_PULSE','JS_GPS','TOKEN_START','TOKEN_READY','TOKEN_FAILED','JS_HTTP_START','JS_HTTP_RETURN','JS_HTTP_FAILED','JS_BODY_START','JS_BODY_READY','NATIVE_HTTP_START','NATIVE_HTTP_RESULT','NATIVE_HTTP_TIMEOUT','NATIVE_HTTP_INTERRUPTED','NATIVE_HTTP_ERROR','ACK_CONFIRMED','ACK_REJECTED','SCREEN_OFF','SCREEN_ON','POWER','NETWORK','EXPIRY_POWER','REPORT_READ']);
const kinds=new Set(['NONE','HEARTBEAT','GPS','AVAILABILITY','AUTH']);
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const integer=(v:unknown):v is number=>Number.isSafeInteger(v)&&Number(v)>=0;
function power(value:unknown) {
 const input=object(value)?value:{};const output:Record<string,boolean|string|number|null>={};
 for(const key of ['interactive','deviceIdle','powerSave','ignoringOptimizations','lowPowerStandby','lowPowerExempt','networkValidated','wakeHeld','receiverListening','networkCallback'])output[key]=typeof input[key]==='boolean'?input[key] as boolean:null;
 output.transport=['WIFI','CELLULAR','ETHERNET','VPN','OTHER','NONE','UNKNOWN'].includes(String(input.transport))?String(input.transport):'UNKNOWN';
 output.dataSaver=integer(input.dataSaver)&&input.dataSaver<=3?input.dataSaver:null;return output;
}
/** Whitelist only safe native facts before display/copy; never echo arbitrary JSON. */
export function sanitizeDutyDiagnostics(value:unknown) {
 if(!object(value)||value.schema!==1||!['IDLE','ACTIVE','EXPIRED','STOPPED'].includes(String(value.state))||typeof value.active!=='boolean'||!integer(value.elapsedMs)||!Array.isArray(value.events)||!object(value.counters))throw Error('Native diagnostic format could not be verified.');
 const events=value.events.slice(-96).flatMap(event=>{
  if(!object(event)||!integer(event.ms)||!stages.has(String(event.stage))||!kinds.has(String(event.kind)))return [];
  return [{ms:event.ms,stage:String(event.stage),kind:String(event.kind),...(integer(event.request)&&event.request>0?{request:event.request}:{}),...(integer(event.status)&&event.status>=100&&event.status<=599?{status:event.status}:{}),...(object(event.power)?{power:power(event.power)}:{})}];
 });
 const counters:Record<string,{count:number;lastMs:number;status?:number}>={};
 for(const [key,count] of Object.entries(value.counters).slice(0,200)) {
  const [stage,kind,...extra]=key.split('.');if(extra.length||!stages.has(stage)||!kinds.has(kind)||!object(count)||!integer(count.count)||!integer(count.lastMs))continue;
  counters[key]={count:count.count,lastMs:count.lastMs,...(integer(count.status)&&count.status>=100&&count.status<=599?{status:count.status}:{})};
 }
 return {schema:1,stopReason:['NONE','LOCAL_STOP','ACK_EXPIRED','PERMISSION_LOST','LOCATION_REQUEST_FAILED','SERVICE_FAILED'].includes(String(value.stopReason))?String(value.stopReason):'UNKNOWN',state:String(value.state),active:value.active,elapsedMs:value.elapsedMs,nativeFixAgeMs:integer(value.nativeFixAgeMs)&&value.nativeFixAgeMs<=86400000?value.nativeFixAgeMs:-1,events,counters,power:power(value.power)};
}
