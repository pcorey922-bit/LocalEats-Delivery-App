import {nativeStep,NativeStepError} from './native-startup';
export type NativeClerkBridge={
 getState():Promise<unknown>;
 getToken(options:{skipCache:boolean;expectedPrincipal:string}):Promise<{token?:unknown}>;
 signInWithTicket(options:{ticket:string;requestId:string}):Promise<unknown>;
 cancelAuthRequest(options:{requestId:string}):Promise<void>;
 signOut():Promise<unknown>;
};
export type NativeClerkState=Readonly<{isLoaded:boolean;isSignedIn:boolean;userId:string|null;sessionId:string|null;fullName:string|null;emailAddress:string|null;error:string|null}>;
const signedOut:NativeClerkState=Object.freeze({isLoaded:true,isSignedIn:false,userId:null,sessionId:null,fullName:null,emailAddress:null,error:null});
function state(value:unknown):NativeClerkState{
 if(!value||typeof value!=='object'||Array.isArray(value))throw new NativeStepError('NATIVE_AUTH_STATE_INVALID');
 const v=value as Record<string,unknown>;
 if(v.isLoaded!==true||typeof v.isSignedIn!=='boolean')throw new NativeStepError('NATIVE_AUTH_STATE_INVALID');
 if(v.isSignedIn===false)return signedOut;
 if(typeof v.userId!=='string'||!/^[A-Za-z0-9_-]{1,200}$/.test(v.userId)||typeof v.sessionId!=='string'||!/^[A-Za-z0-9_-]{1,200}$/.test(v.sessionId))throw new NativeStepError('NATIVE_AUTH_STATE_INVALID');
 return Object.freeze({isLoaded:true,isSignedIn:true,userId:v.userId,sessionId:v.sessionId,fullName:typeof v.fullName==='string'?v.fullName.slice(0,256):null,emailAddress:typeof v.emailAddress==='string'?v.emailAddress.slice(0,320):null,error:null});
}
/** UI projects the official native SDK's principal. No credential cache or roles. */
export function createNativeClerkStore(bridge:NativeClerkBridge){
 let snapshot:NativeClerkState=Object.freeze({...signedOut,isLoaded:false}),epoch=0;
 let restoring:Promise<void>|null=null,localSignOut=false;
 const listeners=new Set<()=>void>(),invalidators=new Set<()=>void>();
 const tickets=new Map<string,Promise<void>>();
 const publish=(next:NativeClerkState)=>{
  if(snapshot.userId!==next.userId||snapshot.sessionId!==next.sessionId)for(const invalidate of invalidators)invalidate();
  snapshot=next;for(const listener of listeners)listener();
 };
 const refresh=()=>{
  if(localSignOut)return Promise.resolve();
  if(restoring)return restoring;
  const owner=epoch,controller=new AbortController();
  const pending=nativeStep('NATIVE_AUTH_RESTORE_TIMEOUT',()=>bridge.getState(),controller.signal).then(value=>{
   if(owner!==epoch)return;publish(state(value));
  }).catch(()=>{if(owner===epoch)publish(Object.freeze({...snapshot,error:'NATIVE_AUTH_RESTORE_FAILED'}));}).finally(()=>{controller.abort();if(restoring===pending)restoring=null;});
  restoring=pending;return pending;
 };
 return{
  getSnapshot:()=>snapshot,
  subscribe:(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};},
  invalidateBeforeIdentityChange:(listener:()=>void)=>{invalidators.add(listener);return()=>{invalidators.delete(listener);};},
  refresh,
  async getToken(options?:{skipCache?:boolean}){
   const owner=epoch,actor=snapshot.userId,session=snapshot.sessionId;if(localSignOut||!snapshot.isSignedIn||!actor)return null;
   const controller=new AbortController();
   try{
    const value=await nativeStep('NATIVE_AUTH_TOKEN_TIMEOUT',()=>bridge.getToken({skipCache:options?.skipCache===true,expectedPrincipal:actor}),controller.signal);
    if(owner!==epoch||actor!==snapshot.userId||session!==snapshot.sessionId||!snapshot.isSignedIn||localSignOut)throw new NativeStepError('NATIVE_AUTH_SESSION_CHANGED');
    if(typeof value?.token!=='string'||value.token.length===0)throw new NativeStepError('NATIVE_AUTH_TOKEN_INVALID');
    return value.token;
   }catch(error){if(owner===epoch)void refresh();throw error;}finally{controller.abort();}
  },
  activateTicket(ticket:string,requestId:string,signal:AbortSignal){
   const existing=tickets.get(requestId);if(existing)return existing;
   const owner=++epoch;restoring=null;
   const cancel=()=>{void bridge.cancelAuthRequest({requestId}).catch(()=>{});};
   signal.addEventListener('abort',cancel,{once:true});
   const pending=nativeStep('NATIVE_ACTIVATION_TIMEOUT',()=>bridge.signInWithTicket({ticket,requestId}),signal).then(value=>{
    if(owner!==epoch)throw new NativeStepError('NATIVE_AUTH_SESSION_CHANGED');
    const next=state(value);if(!next.isSignedIn)throw new NativeStepError('NATIVE_ACTIVATION_UNCONFIRMED');localSignOut=false;publish(next);
   }).catch(error=>{cancel();if(owner===epoch){localSignOut=true;publish(signedOut);}throw error;}).finally(()=>{signal.removeEventListener('abort',cancel);if(tickets.get(requestId)===pending)tickets.delete(requestId);});
   tickets.set(requestId,pending);return pending;
  },
  async signOut(){
   const owner=++epoch;localSignOut=true;restoring=null;publish(signedOut);
   const controller=new AbortController();
   try{await nativeStep('NATIVE_AUTH_SIGN_OUT_TIMEOUT',()=>bridge.signOut(),controller.signal);}
   catch(error){if(owner===epoch)publish(Object.freeze({...signedOut,error:'NATIVE_AUTH_SIGN_OUT_UNCONFIRMED'}));throw error;}finally{controller.abort();}
  },
 };
}
