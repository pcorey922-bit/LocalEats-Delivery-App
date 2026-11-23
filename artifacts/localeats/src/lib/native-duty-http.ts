import type { FetchRequestStage } from '../../../../lib/api-client-react/src/custom-fetch';
import type { NativeDutyRequest, NativeDutyResponse } from './native-duty-diagnostics';
type Options={method?:string;body?:string;headers?:HeadersInit;signal:AbortSignal;onStage?:(stage:FetchRequestStage)=>void;nativePulse?:{id:string;sequence:string}};
type Bridge={requestDuty:(request:NativeDutyRequest)=>Promise<NativeDutyResponse>;cancelDutyRequest:(request:{requestId:string})=>Promise<void>};
export class NativeDutyHttpError extends Error {
 constructor(readonly status:number,readonly code='NATIVE_HTTP_REJECTED'){super(`Driver telemetry request could not be verified. HTTP ${status}. Code: ${code}.`);}
}
/** Direct native JSON RPC, never synthetic Fetch Response/Blob/ReadableStream. */
export async function nativeDutyHttp<T>(bridge:Bridge,getToken:()=>Promise<string|null>,origin:string,path:string,options:Options):Promise<T> {
 const method=(options.method??'GET').toUpperCase();
 const allowed=method==='GET'&&path==='/api/driver/availability'||method==='POST'&&(path==='/api/driver/heartbeat'||path==='/api/driver/location'||/^\/api\/driver\/orders\/[a-f0-9-]+\/location$/.test(path));
 const base=new URL(origin);if(!allowed||base.protocol!=='https:'||base.hostname!=='localeats-delivery-app.onrender.com'||base.username||base.password)throw new NativeDutyHttpError(0,'DUTY_ROUTE_REJECTED');
 const stage=(value:FetchRequestStage)=>{try{options.onStage?.(value);}catch{}};
 options.signal.throwIfAborted();
 const headers=new Headers(options.headers);headers.set('accept','application/json');
 if(!headers.has('authorization')){
  stage('TOKEN_START');let token:string|null;
  try{token=await getToken();stage('TOKEN_READY');}catch(error){stage('TOKEN_FAILED');throw error;}
  options.signal.throwIfAborted();if(!token)throw new NativeDutyHttpError(401);
  headers.set('authorization',`Bearer ${token}`);
 }
 let data:unknown;if(options.body!==undefined){data=JSON.parse(options.body);headers.set('content-type','application/json');}
 const requestId=crypto.randomUUID();
 const cancel=()=>{try{void bridge.cancelDutyRequest({requestId}).catch(()=>{});}catch{}};
 options.signal.addEventListener('abort',cancel,{once:true});
 try {
  options.signal.throwIfAborted();stage('JS_HTTP_START');
  let response:NativeDutyResponse;
  try{response=await bridge.requestDuty({requestId,url:new URL(path,base).toString(),method,headers:Object.fromEntries(headers),...(data===undefined?{}:{data}),...(options.nativePulse??{})});}
  catch(error){
   options.signal.throwIfAborted();
   const code=(error as {code?:string})?.code;
   if(['DUTY_REQUEST_TIMEOUT','DUTY_REQUEST_FAILED','DUTY_REQUEST_BUSY','DUTY_REQUEST_CANCELED'].includes(code??''))throw new NativeDutyHttpError(code==='DUTY_REQUEST_TIMEOUT'?408:503,'NATIVE_DUTY_TRANSPORT_INTERRUPTED');
   throw error;
  }
  options.signal.throwIfAborted();stage('JS_HTTP_RETURN');
  if(!Number.isInteger(response.status)||response.status<100||response.status>599)throw new NativeDutyHttpError(0,'DUTY_NATIVE_RESPONSE_INVALID');
  if(response.status<200||response.status>=300)throw new NativeDutyHttpError(response.status);
  stage('JS_BODY_START');
  // Some bridges return JSON text. Parse synchronously; never call Response.text().
  let body:unknown;try{body=typeof response.data==='string'?JSON.parse(response.data):response.data;}catch{throw new NativeDutyHttpError(response.status,'DUTY_NATIVE_RESPONSE_INVALID');}
  if(!body||typeof body!=='object')throw new NativeDutyHttpError(response.status,'DUTY_NATIVE_RESPONSE_INVALID');
  if(options.nativePulse && (response.nativeAcknowledged!==true||(body as {online?:unknown}).online!==true))throw new NativeDutyHttpError(response.status,'DUTY_NATIVE_RESPONSE_INVALID');
  stage('JS_BODY_READY');return body as T;
 } finally {options.signal.removeEventListener('abort',cancel);}
}
