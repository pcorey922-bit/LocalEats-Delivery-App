import { BlockList, isIP } from 'node:net';
import type { Request } from 'express';
// Official Cloudflare ranges retrieved 2026-11-20; no runtime network dependency.
// https://www.cloudflare.com/ips-v4 and /ips-v6
const edge = new BlockList(), internal = new BlockList();
for (const cidr of ['173.245.48.0/20','103.21.244.0/22','103.22.200.0/22','103.31.4.0/22','141.101.64.0/18','108.162.192.0/18','190.93.240.0/20','188.114.96.0/20','197.234.240.0/22','198.41.128.0/17','162.158.0.0/15','104.16.0.0/13','104.24.0.0/14','172.64.0.0/13','131.0.72.0/22','2400:cb00::/32','2606:4700::/32','2803:f800::/32','2405:b500::/32','2405:8100::/32','2a06:98c0::/29','2c0f:f248::/32']) {
  const [ip,bits]=cidr.split('/');edge.addSubnet(ip,Number(bits),isIP(ip)===6?'ipv6':'ipv4');
}
for (const [ip,bits] of [['10.0.0.0',8],['172.16.0.0',12],['192.168.0.0',16],['127.0.0.0',8],['fc00::',7],['::1',128]] as const) internal.addSubnet(ip,bits,isIP(ip)===6?'ipv6':'ipv4');
function normalize(raw: string | undefined): string | undefined {
  if (!raw || raw.includes("%") || !isIP(raw)) return;
  if (raw.toLowerCase().startsWith('::ffff:') && isIP(raw.slice(7))===4) return raw.slice(7);
  return isIP(raw)===6 ? new URL(`http://[${raw}]/`).hostname.slice(1,-1) : raw;
}
const matches=(list:BlockList,ip:string)=>list.check(ip,isIP(ip)===6?'ipv6':'ipv4');
function onRender(env:NodeJS.ProcessEnv) {
  if(env.RENDER!=='true')return false;
  try { const u=new URL(env.RENDER_EXTERNAL_URL||'');return u.protocol==='https:' && u.hostname.endsWith('.onrender.com') && !u.username && !u.password && !u.port && u.pathname==='/' && !u.search && !u.hash; } catch {return false;}
}
/** Rate-limit identity only. Never changes Express host/protocol/auth trust. */
export function clientAddress(req: Pick<Request,'headers'|'socket'>, env=process.env):string {
  const peer=normalize(req.socket.remoteAddress);
  if (!peer) return 'unknown';
  if (!onRender(env) || (!matches(internal,peer) && !matches(edge,peer))) return peer;
  const raw=req.headers['x-forwarded-for'];
  if(typeof raw!=='string') return peer;
  // Discard excess caller-controlled prefixes, not the trusted suffix.
  const chain=raw.split(',').slice(-32);
  let sawEdge=matches(edge,peer);
  for(let i=chain.length-1;i>=0;i--){
    const ip=normalize(chain[i].trim());if(!ip)return peer;
    if(matches(edge,ip)){sawEdge=true;continue;}
    if(matches(internal,ip))continue;
    // Do not trust an arbitrary public hop without the documented CDN boundary.
    return sawEdge ? ip : peer;
  }
  return peer;
}
/** IPv6 privacy-address rotation must not create unlimited independent buckets. */
export function clientRateKey(req:Pick<Request,'headers'|'socket'>,env=process.env):string {
  const ip=clientAddress(req,env);if(isIP(ip)!==6)return ip;
  const [head,tail='']=ip.split('::'),left=head?head.split(':'):[],right=tail?tail.split(':'):[];
  const groups=ip.includes('::')?[...left,...Array(8-left.length-right.length).fill('0'),...right]:left;
  return groups.slice(0,4).map(x=>parseInt(x,16).toString(16)).join(':')+'::/64';
}

/** Public diagnostics report the path used, never the visitor address. */
export function clientIpSource(req:Pick<Request,'headers'|'socket'>,env=process.env) {
  const peer=normalize(req.socket.remoteAddress);
  return clientAddress(req,env)!==(peer||'unknown') ? 'render_cdn_chain' : 'socket';
}
