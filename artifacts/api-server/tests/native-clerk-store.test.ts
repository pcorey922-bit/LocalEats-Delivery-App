import test from 'node:test';
import assert from 'node:assert/strict';
import {createNativeClerkStore,type NativeClerkBridge} from '../../localeats/src/lib/native-clerk-store';
const user=(id='user_fixture_owner',session='sess_fixture_native')=>({isLoaded:true,isSignedIn:true,userId:id,sessionId:session,fullName:'Fixture owner'});
const deferred=<T>()=>{let resolve!:(value:T)=>void;const promise=new Promise<T>(r=>{resolve=r;});return{promise,resolve};};
const flush=()=>new Promise<void>(r=>setImmediate(r));
function fixture(overrides:Partial<NativeClerkBridge>={}){
 let tokens=0;const bridge:NativeClerkBridge={getState:async()=>user(),getToken:async()=>{tokens++;return{token:'simulated-sdk-token'};},signInWithTicket:async()=>user(),cancelAuthRequest:async()=>{},signOut:async()=>({isLoaded:true,isSignedIn:false}),...overrides};
 return{store:createNativeClerkStore(bridge),tokens:()=>tokens};
}
test('native SDK restore supplies the same principal; UI token requests use native SDK renewal without Web Clerk',async()=>{
 const requests:unknown[]=[];const f=fixture({getToken:async options=>{requests.push(options);return{token:'simulated-token'};}});
 assert.equal(f.store.getSnapshot().isLoaded,false);await f.store.refresh();assert.equal(f.store.getSnapshot().userId,'user_fixture_owner');
 assert.equal(await f.store.getToken({skipCache:true}),'simulated-token');assert.deepEqual(requests,[{skipCache:true,expectedPrincipal:'user_fixture_owner'}]);
 assert.equal('role' in f.store.getSnapshot(),false,'Roles stay backend-authoritative');
});
test('malformed native identity never becomes signed in and explicit retry recovers',async()=>{
 let invalid=true;const f=fixture({getState:async()=>invalid?{isLoaded:true,isSignedIn:true,role:'admin'}:user()});
 await f.store.refresh();assert.equal(f.store.getSnapshot().isSignedIn,false);assert.equal(f.store.getSnapshot().error,'NATIVE_AUTH_RESTORE_FAILED');assert.equal(await f.store.getToken(),null);assert.equal(f.tokens(),0);
 invalid=false;await f.store.refresh();assert.equal(f.store.getSnapshot().isSignedIn,true);assert.equal(f.store.getSnapshot().error,null);
});
test('duplicate native handoff callbacks share one SDK ticket consumption',async()=>{
 const reply=deferred<unknown>();let calls=0;const f=fixture({signInWithTicket:()=>{calls++;return reply.promise;}});const signal=new AbortController().signal;
 const first=f.store.activateTicket('simulated-ticket','request-1',signal),second=f.store.activateTicket('simulated-ticket','request-1',signal);assert.equal(first,second);assert.equal(calls,1);
 reply.resolve(user());await first;assert.equal(f.store.getSnapshot().isSignedIn,true);
});
test('sign-out fences an old restoration and remains locally signed out when provider removal fails',async()=>{
 const old=deferred<unknown>();const f=fixture({getState:()=>old.promise,signOut:async()=>{throw Error('Simulated network failure');}});
 const loading=f.store.refresh();await assert.rejects(f.store.signOut());old.resolve(user());await loading;await f.store.refresh();assert.equal(f.store.getSnapshot().isSignedIn,false);assert.equal(await f.store.getToken(),null);assert.equal(f.tokens(),0);
});
test('token returned after identity/session replacement cannot reach a backend request',async()=>{
 const token=deferred<{token:string}>();let current=user();const f=fixture({getToken:()=>token.promise,getState:async()=>current});await f.store.refresh();const pending=f.store.getToken();
 current=user('user_fixture_other','sess_fixture_new');await f.store.refresh();token.resolve({token:'simulated-old-token'});await assert.rejects(pending,/NATIVE_AUTH_SESSION_CHANGED/);assert.equal(f.store.getSnapshot().userId,'user_fixture_other');
});
test('ticket cancellation reaches native fence; a delayed activated session cannot restore UI access',async()=>{
 const ticket=deferred<unknown>();let cancels=0;const f=fixture({signInWithTicket:()=>ticket.promise,cancelAuthRequest:async()=>{cancels++;}});const abort=new AbortController();
 const pending=f.store.activateTicket('simulated-ticket','request-cancel',abort.signal);abort.abort();await assert.rejects(pending);ticket.resolve(user());await flush();assert.ok(cancels>0);assert.equal(f.store.getSnapshot().isSignedIn,false);assert.equal(await f.store.getToken(),null);
});
test('native restore and token UI requests are bounded and late results cannot fabricate access',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const late=deferred<unknown>();const f=fixture({getState:()=>late.promise});const pending=f.store.refresh();t.mock.timers.tick(15000);await pending;assert.equal(f.store.getSnapshot().error,'NATIVE_AUTH_RESTORE_FAILED');late.resolve(user());await flush();assert.equal(f.store.getSnapshot().isSignedIn,false);
 const token=deferred<{token:string}>();const valid=fixture({getToken:()=>token.promise});await valid.store.refresh();const awaiting=valid.store.getToken();t.mock.timers.tick(15000);await assert.rejects(awaiting,/NATIVE_AUTH_TOKEN_TIMEOUT/);token.resolve({token:'simulated-late-token'});await flush();
});
test('private query invalidation happens before publishing another native principal',async()=>{
 let current=user();const f=fixture({getState:async()=>current});await f.store.refresh();const order:string[]=[];
 f.store.invalidateBeforeIdentityChange(()=>{assert.equal(f.store.getSnapshot().userId,'user_fixture_owner');order.push('clear');});f.store.subscribe(()=>order.push('publish'));
 current=user('user_fixture_other');await f.store.refresh();assert.deepEqual(order,['clear','publish']);
});

test('late failure from an older sign-out cannot erase a newer ticket identity',async()=>{
 let fail!:(reason:Error)=>void;const old=new Promise<unknown>((_,reject)=>{fail=reject});
 const f=fixture({signOut:()=>old,signInWithTicket:async()=>user('user_fixture_new','sess_fixture_new')});await f.store.refresh();
 const leaving=assert.rejects(f.store.signOut());await f.store.activateTicket('simulated-ticket','new-ticket',new AbortController().signal);
 fail(Error('Simulated old sign-out failure'));await leaving;assert.equal(f.store.getSnapshot().userId,'user_fixture_new');assert.equal(f.store.getSnapshot().error,null);
});
