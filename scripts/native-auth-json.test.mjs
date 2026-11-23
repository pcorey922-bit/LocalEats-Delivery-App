// Actual version-pinned Android bridge reader, tested offline. Clerk/session and
// deferred WebView stream behavior are simulated; no credential or provider call.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const require=createRequire(new URL('../artifacts/localeats/package.json',import.meta.url));
const root=path.dirname(require.resolve('@capacitor/android/package.json'));
const bridge=await readFile(path.join(root,'capacitor/src/main/assets/native-bridge.js'),'utf8');
const start=bridge.indexOf('    function rocoNativeAuthJsonResponse('),end=bridge.indexOf('    // End RoCoEats native Clerk JSON reader.');
assert.ok(start>=0&&end>start,'Installed pinned native patch must include the tested reader');
const reader=new Function('Response','TextEncoder','Blob',bridge.slice(start,end)+';return rocoNativeAuthJsonResponse;')(Response,TextEncoder,Blob);
const wrap=(text,init={},trace=()=>{})=>reader(new Response(text,{headers:{'content-type':'application/json'},...init}),text,trace);

test('Clerk-style shared token resolver completes while synthetic Fetch body readers are stalled',async()=>{
 const oldJson=Response.prototype.json,oldText=Response.prototype.text;
 let legacyRead=false,legacyDone=false;
 Response.prototype.json=function(){legacyRead=true;return new Promise(()=>{});};
 Response.prototype.text=function(){return new Promise(()=>{});};
 try{
  const text=JSON.stringify({response:{jwt:'simulated-token-not-a-credential'}});
  // Same API ordering as Clerk: JSON read precedes token resource/cache resolution.
  void new Response(text).json().then(()=>{legacyDone=true;});
  let pending,requests=0;
  const getToken=()=>pending??=(async()=>{requests++;const response=wrap(text);const payload=await response.json();return payload.response.jwt;})();
  assert.deepEqual(await Promise.all([getToken(),getToken()]),['simulated-token-not-a-credential','simulated-token-not-a-credential']);
  assert.equal(requests,1,'Preserve shared resolver rather than starting parallel refreshes');
  assert.equal(legacyRead,true);assert.equal(legacyDone,false);
 }finally{Response.prototype.json=oldJson;Response.prototype.text=oldText;}
});
test('cached native bytes preserve JSON/text, status, headers, URL, clone and one-shot body use',async()=>{
 const text='{"value":"Rockwood 🍔"}';const response=wrap(text,{status:401,statusText:'Unauthorized'});
 Object.defineProperty(response,'url',{value:'https://example.invalid/redacted'});
 const copy=response.clone();assert.ok(copy instanceof Response);assert.equal(copy.status,401);assert.equal(copy.ok,false);assert.equal(copy.statusText,'Unauthorized');assert.equal(copy.url,response.url);assert.equal(copy.headers.get('content-type'),'application/json');
 assert.equal(response.bodyUsed,false);assert.equal(await response.text(),text);assert.equal(response.bodyUsed,true);
 assert.deepEqual(await copy.json(),{value:'Rockwood 🍔'});
 await assert.rejects(response.json(),TypeError);assert.throws(()=>response.clone(),TypeError);
});
test('malformed JSON, HTTP errors and locked/consumed streams cannot fabricate a valid token',async()=>{
 const stages=[];const response=wrap('not JSON',{},value=>stages.push(value));
 await assert.rejects(response.json(),SyntaxError);assert.equal(response.bodyUsed,true);assert.deepEqual(stages,['JS_BODY_START','JS_BODY_FAILED']);
 const denied=wrap('{"errors":[{"code":"session_revoked"}]}',{status:403});assert.equal(denied.ok,false);assert.deepEqual(await denied.json(),{errors:[{code:'session_revoked'}]});
 const locked=wrap('{}');const stream=locked.body.getReader();await assert.rejects(locked.json(),TypeError);assert.throws(()=>locked.clone(),TypeError);stream.releaseLock();assert.deepEqual(await locked.json(),{});
 const consumed=wrap('{}');const external=consumed.body.getReader();await external.read();await assert.rejects(consumed.text(),TypeError);assert.throws(()=>consumed.clone(),TypeError);external.releaseLock();
});
test('all supported readers honor one-shot semantics and observation cannot block authentication',async()=>{
 const text='{"n":1}';const raw=wrap(text);assert.equal(new TextDecoder().decode(await raw.arrayBuffer()),text);await assert.rejects(raw.text(),TypeError);
 const blob=await wrap(text).blob();assert.equal(blob.type,'application/json');assert.equal(await blob.text(),text);
 const form=wrap(text);await assert.rejects(form.formData(),TypeError);assert.equal(form.bodyUsed,true);
 const trace=()=>{throw Error('Observer unavailable');};assert.deepEqual(await wrap(text,{},trace).json(),{n:1});
});
test('only native-owned metadata enables the reader; SDK/provider data cannot opt itself in',()=>{
 assert.match(bridge,/nativeResponse\.rocoeatsAuthJson === true/);
 assert.match(bridge,/contentType\.toLowerCase\(\)\.startsWith\('application\/json'\)/);
 assert.match(bridge,/cap\.nativePromise\('CapacitorHttp', 'recordDutyAuthBody'/);
});
