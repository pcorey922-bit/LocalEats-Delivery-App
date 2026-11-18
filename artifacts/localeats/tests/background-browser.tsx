// Isolated UI fixture: simulated native bridge and API, never a production route.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DriverDutySession } from '../src/pages/driver-duty-session';
import { BackgroundDutyRecovery } from '../src/pages/background-duty-location';
import { dutyIntent } from '../src/lib/duty-intent';
const qa = window as unknown as {
  bgPermission: boolean; bgStarts: number; bgRemovals: string[]; bgUploads: number;
  bgDenied: boolean; emitFix?: (fix: unknown) => void; offline: () => void;
};
qa.bgPermission = true; qa.bgStarts = 0; qa.bgRemovals = []; qa.bgUploads = 0; qa.bgDenied = false;
qa.offline = () => dutyIntent.set('driver-fixture', false);
dutyIntent.set('driver-fixture', true);
window.fetch = async (input) => {
  const url = String(input);
  if (url === '/api/profiles/me') return Response.json({ id: 'driver-fixture', role: 'driver', displayName: 'Fixture Driver', createdAt: '2026-11-18T00:00:00.000Z' });
  if (url === '/api/driver/availability') return Response.json({ approved: true, available: true, online: true, activeOrderId: null });
  if (url === '/api/driver/location') { qa.bgUploads++; return qa.bgDenied ? Response.json({ error: 'Access revoked' }, { status: 403 }) : Response.json({ accepted: true }); }
  return Response.json({ online: true });
};
createRoot(document.getElementById('root')!).render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><BackgroundDutyRecovery/><DriverDutySession/></QueryClientProvider>);
