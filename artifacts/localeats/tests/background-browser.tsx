import { registerPush } from '../src/lib/mobile';
// Isolated UI fixture: simulated native bridge and API, never a production route.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DriverAvailability } from '../src/pages/delivery-tracking';
import { DriverDutySession } from '../src/pages/driver-duty-session';
import { BackgroundDutyRecovery } from '../src/pages/background-duty-location';
import { dutyIntent } from '../src/lib/duty-intent';
import { PushPreferences } from '../src/pages/push-preferences';
const qa = window as unknown as {
  dutyAvailabilityInvalid?:boolean; dutyAvailable?: boolean; dutyApproved?: boolean; dutyReconnectFails?:boolean; dutyReconnectDelay?:boolean; finishDutyReconnect?:()=>void; dutyReconnectWrites?:number; dutyAvailabilityDelay?:boolean; dutyAvailabilityAborted?:boolean; finishDutyAvailability?:()=>void;
  dutyLease?: boolean; dutyLastHeartbeat?: number; refreshDuty: () => Promise<void>;
  bgPermission: boolean; bgStarts: number; bgRemovals: string[]; bgUploads: number;
  bgDenied: boolean; emitFix?: (fix: unknown) => void; offline: () => void;
  pushPostAborted?: boolean; pushPosts?: number;
  pushConfigReadAborted?: boolean; pushConfigDelay?: boolean; finishPushConfig?: () => void;
  pushStatusDelay?: boolean; finishPushStatus?: () => void;
  pushDeleteDelay?: boolean; finishPushDelete?: () => void; pushDeleteAborted?: boolean;
  dutyOrderId?:string; dutyPostDelay?:boolean; finishDutyPost?:()=>void; dutyPostAborted?:boolean; dutyMalformed?:boolean; dutyOrderUploads?:number;
  dutyHeartbeatDelay?:boolean; finishDutyHeartbeat?:()=>void; dutyHeartbeatAborted?:boolean; dutyHeartbeats?:number;
  directRegisterPush: () => Promise<void>; pushRegistration?: {platform:string;appId:string};
  pushPostDelay?: boolean; finishPushEnrollment?: () => void;
  pushConfigured: boolean; pushRegistered: boolean; pushDeleteFails: boolean; pushRevocation?: unknown;
};
qa.directRegisterPush=()=>registerPush();
qa.bgPermission = true; qa.bgStarts = 0; qa.bgRemovals = []; qa.bgUploads = 0; qa.bgDenied = false;
qa.offline = () => dutyIntent.set('driver-fixture', false);
qa.pushConfigured = true; qa.pushRegistered = localStorage.getItem('qa-server-push') === 'true'; qa.pushDeleteFails = false;
const reconnect = location.search.includes('reconnect=true');
qa.dutyAvailable=true;qa.dutyApproved=true;
if(reconnect) {qa.bgPermission=false;qa.dutyLease=true;qa.dutyLastHeartbeat=Date.now()-121000;}
dutyIntent.set('driver-fixture', !reconnect);
window.fetch = async (input, options) => {
  const url = String(input);
  if (url === '/api/notification-devices/config') { if(qa.pushConfigDelay) { options?.signal?.addEventListener('abort',()=>{qa.pushConfigReadAborted=true;},{once:true}); await new Promise<void>(resolve=>{qa.finishPushConfig=resolve;}); } return Response.json({ android: qa.pushConfigured, ios: location.search.includes('ios=true') && qa.pushConfigured }); }
  if (url === '/api/notification-devices') {
    if (options?.method === 'DELETE') {
      qa.pushRevocation = JSON.parse(String(options.body));
      if(qa.pushDeleteDelay) { options.signal?.addEventListener('abort',()=>{qa.pushDeleteAborted=true;},{once:true}); await new Promise<void>(resolve=>{qa.finishPushDelete=resolve;}); }
      if (qa.pushDeleteFails) return Response.json({ error: 'Simulated removal outage' }, { status: 503 });
      qa.pushRegistered = false; localStorage.setItem('qa-server-push', 'false'); return new Response(null, { status: 204 });
    }
    qa.pushRegistration=JSON.parse(String(options?.body));
    qa.pushPosts=(qa.pushPosts??0)+1;
    options?.signal?.addEventListener('abort',()=>{qa.pushPostAborted=true;},{once:true});
    if (qa.pushPostDelay) await new Promise<void>(resolve=>{qa.finishPushEnrollment=resolve;});
    qa.pushRegistered = true; localStorage.setItem('qa-server-push', 'true'); return Response.json({ registered: true, deviceId: '11111111-1111-4111-8111-111111111119' }, { status: 201 });
  }
  if (url.startsWith('/api/notification-devices/')) { if(qa.pushStatusDelay)await new Promise<void>(resolve=>{qa.finishPushStatus=resolve;}); return qa.pushRegistered ? Response.json({ registered: true, platform: location.search.includes('ios=true')?'ios':'android', appId: location.search.includes('ios=true')?'com.rocoeats.driver':'com.rocoeats.driver.staging' }) : Response.json({ error: 'Not registered' }, { status: 404 }); }
  if (url === '/api/profiles/me') return Response.json({ id: 'driver-fixture', role: location.search.includes('owner=true') ? 'admin' : 'driver', displayName: 'Fixture Driver', createdAt: '2026-11-18T00:00:00.000Z' });
  if (url === '/api/driver/availability') {
    if (options?.method === 'PUT') {
      qa.dutyReconnectWrites=(qa.dutyReconnectWrites??0)+1;
      if(qa.dutyReconnectDelay)await new Promise<void>(resolve=>{qa.finishDutyReconnect=resolve;});
      if(qa.dutyReconnectFails)return Response.json({error:'Reconnect rejected by server'},{status:403});
      qa.dutyAvailable=JSON.parse(String(options.body)).available;
      qa.dutyLastHeartbeat=Date.now();
      // Real PUT response deliberately omits approval; GET establishes eligibility.
      return Response.json({available:qa.dutyAvailable,online:qa.dutyAvailable,activeOrderId:null});
    }
    if(qa.dutyAvailabilityDelay) {options?.signal?.addEventListener('abort',()=>{qa.dutyAvailabilityAborted=true;},{once:true});await new Promise<void>(resolve=>{qa.finishDutyAvailability=resolve;});}
    if(qa.dutyAvailabilityInvalid)return Response.json({available:true,online:true});
    return Response.json({ approved: qa.dutyApproved, available: qa.dutyAvailable, online: !!qa.dutyAvailable && (!qa.dutyLease || Date.now() - (qa.dutyLastHeartbeat ?? 0) < 90000), activeOrderId: qa.dutyOrderId ?? null });
  }
  if (url === '/api/driver/location') {
    qa.bgUploads++;
    if(qa.dutyPostDelay) { options?.signal?.addEventListener('abort',()=>{qa.dutyPostAborted=true;},{once:true}); await new Promise<void>(resolve=>{qa.finishDutyPost=resolve;}); }
    return qa.bgDenied ? Response.json({ error: 'Access revoked' }, { status: 403 }) : Response.json({ accepted: qa.dutyMalformed ? 'false' : true });
  }
  if (url.startsWith('/api/driver/orders/') && url.endsWith('/location')) { qa.dutyOrderUploads=(qa.dutyOrderUploads??0)+1; return Response.json({accepted:true}); }
  if (url === '/api/driver/heartbeat') {
    qa.dutyHeartbeats=(qa.dutyHeartbeats??0)+1;
    if(qa.dutyHeartbeatDelay) { options?.signal?.addEventListener('abort',()=>{qa.dutyHeartbeatAborted=true;},{once:true}); await new Promise<void>(resolve=>{qa.finishDutyHeartbeat=resolve;}); }
    if (qa.dutyLease && qa.dutyLastHeartbeat !== undefined && Date.now() - qa.dutyLastHeartbeat >= 90000) return Response.json({error:'Reconnect explicitly'}, {status:409});
    qa.dutyLastHeartbeat=Date.now();
    return Response.json({online:true});
  }
  return Response.json({ online: true });
};
const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
qa.refreshDuty=()=>client.invalidateQueries({queryKey:['driver-availability']});
createRoot(document.getElementById('root')!).render(<QueryClientProvider client={client}>{location.search.includes('push=true') ? <PushPreferences/> : <><BackgroundDutyRecovery/><DriverAvailability/><DriverDutySession/>{location.search.includes('permissions=true') && <PushPreferences/>}</>}</QueryClientProvider>);
