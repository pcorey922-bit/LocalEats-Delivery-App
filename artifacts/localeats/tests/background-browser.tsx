// Isolated UI fixture: simulated native bridge and API, never a production route.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DriverDutySession } from '../src/pages/driver-duty-session';
import { BackgroundDutyRecovery } from '../src/pages/background-duty-location';
import { dutyIntent } from '../src/lib/duty-intent';
import { PushPreferences } from '../src/pages/push-preferences';
const qa = window as unknown as {
  bgPermission: boolean; bgStarts: number; bgRemovals: string[]; bgUploads: number;
  bgDenied: boolean; emitFix?: (fix: unknown) => void; offline: () => void;
  pushConfigured: boolean; pushRegistered: boolean; pushDeleteFails: boolean; pushRevocation?: unknown;
};
qa.bgPermission = true; qa.bgStarts = 0; qa.bgRemovals = []; qa.bgUploads = 0; qa.bgDenied = false;
qa.offline = () => dutyIntent.set('driver-fixture', false);
qa.pushConfigured = true; qa.pushRegistered = localStorage.getItem('qa-server-push') === 'true'; qa.pushDeleteFails = false;
dutyIntent.set('driver-fixture', true);
window.fetch = async (input, options) => {
  const url = String(input);
  if (url === '/api/notification-devices/config') return Response.json({ android: qa.pushConfigured, ios: false });
  if (url === '/api/notification-devices') {
    if (options?.method === 'DELETE') {
      qa.pushRevocation = JSON.parse(String(options.body));
      if (qa.pushDeleteFails) return Response.json({ error: 'Simulated removal outage' }, { status: 503 });
      qa.pushRegistered = false; localStorage.setItem('qa-server-push', 'false'); return new Response(null, { status: 204 });
    }
    qa.pushRegistered = true; localStorage.setItem('qa-server-push', 'true'); return Response.json({ registered: true, deviceId: '11111111-1111-4111-8111-111111111119' }, { status: 201 });
  }
  if (url.startsWith('/api/notification-devices/')) return qa.pushRegistered ? Response.json({ registered: true, platform: 'android', appId: 'com.rocoeats.driver.staging' }) : Response.json({ error: 'Not registered' }, { status: 404 });
  if (url === '/api/profiles/me') return Response.json({ id: 'driver-fixture', role: 'driver', displayName: 'Fixture Driver', createdAt: '2026-11-18T00:00:00.000Z' });
  if (url === '/api/driver/availability') return Response.json({ approved: true, available: true, online: true, activeOrderId: null });
  if (url === '/api/driver/location') { qa.bgUploads++; return qa.bgDenied ? Response.json({ error: 'Access revoked' }, { status: 403 }) : Response.json({ accepted: true }); }
  return Response.json({ online: true });
};
createRoot(document.getElementById('root')!).render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{location.search.includes('push=true') ? <PushPreferences/> : <><BackgroundDutyRecovery/><DriverDutySession/></>}</QueryClientProvider>);
