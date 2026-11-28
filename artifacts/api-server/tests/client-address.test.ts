import {test} from 'node:test';import assert from 'node:assert/strict';
import {clientAddress,clientRateKey} from '../src/lib/client-address';
const env={RENDER:'true',RENDER_EXTERNAL_URL:'https://qa.onrender.com'};
const req=(peer:string,xff?:string)=>({socket:{remoteAddress:peer},headers:{...(xff?{'x-forwarded-for':xff}:{})}} as any);
test('Render chain separates clients without trusting spoofable prefixes or fixed hop counts',()=>{
  for(const client of ['198.51.100.12','203.0.113.24']) for(const suffix of ['172.64.1.2','172.64.1.2, 10.0.0.5, 10.0.0.6']) {
    assert.equal(clientAddress(req('10.0.0.7',`192.0.2.66, ${client}, ${suffix}`),env),client);
    assert.equal(clientAddress(req('10.0.0.7',`garbage, ${client}, ${suffix}`),env),client);
  }
});
test('long forged prefixes cannot force a legitimate edge request into a shared proxy bucket',()=>{
 assert.equal(clientAddress(req('10.0.0.7',Array(100).fill('garbage').join(',')+', 198.51.100.44, 172.64.1.2'),env),'198.51.100.44');
});

test('direct traffic, missing CDN evidence, malformed chains and unsupported deployments never trust forwarded identity',()=>{
  for(const headers of ['192.0.2.66','192.0.2.66, garbage','192.0.2.66, 10.0.0.1',Array(34).fill('172.64.1.2').join(',')]) assert.equal(clientAddress(req('10.0.0.7',headers),env),'10.0.0.7');
  assert.equal(clientAddress(req('198.51.100.44','192.0.2.66, 172.64.1.2'),env),'198.51.100.44');
  assert.equal(clientAddress(req('10.0.0.7','198.51.100.44, 172.64.1.2'),{}),'10.0.0.7');
  assert.equal(clientAddress(req('10.0.0.7','198.51.100.44, 172.64.1.2'),{...env,RENDER_EXTERNAL_URL:'https://qa.onrender.com.attacker.test'}),'10.0.0.7');
});
test('IPv4-mapped forms share identity and IPv6 privacy addresses share a /64 limit',()=>{
 assert.equal(clientAddress(req('::ffff:198.51.100.1')),'198.51.100.1');
 assert.equal(clientRateKey(req('2001:db8:1234:5678::1')),clientRateKey(req('2001:0db8:1234:5678:ffff::2')));
 assert.notEqual(clientRateKey(req('2001:db8:1234:5678::1')),clientRateKey(req('2001:db8:1234:5679::1')));
});

test('actual Express reverse-proxy requests share the old socket IP but get distinct safe rate identities without host/protocol trust',async()=>{
 const {default:express}=await import('express');
 const app=express();app.get('/',(req,res)=>res.json({old:req.ip,key:clientRateKey(req,env),protocol:req.protocol,hostname:req.hostname}));
 const server=app.listen(0,'127.0.0.1');await new Promise<void>(resolve=>server.once('listening',resolve));
 try {
  const port=(server.address() as {port:number}).port;
  const read=async(ip:string)=>(await fetch(`http://127.0.0.1:${port}/`,{headers:{'x-forwarded-for':`192.0.2.66, ${ip}, 172.64.1.2, 10.0.0.1`,'x-forwarded-host':'evil.example','x-forwarded-proto':'https'}})).json();
  const a=await read('198.51.100.1'),b=await read('198.51.100.2');
  assert.equal(a.old,b.old);assert.notEqual(a.key,b.key);assert.equal(a.key,'198.51.100.1');assert.equal(a.protocol,'http');assert.equal(a.hostname,'127.0.0.1');
 } finally {server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}
});
