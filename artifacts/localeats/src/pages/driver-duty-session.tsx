import { useAccountProfile } from '../hooks/use-account-profile';
import { dutyIntent } from "../lib/duty-intent";
import { useDutyIntent } from "../hooks/use-duty-intent";
import { useAppForeground } from "../hooks/use-app-foreground";
import { useCallback, useEffect, useState } from "react";
import { Capacitor } from '@capacitor/core';
import { BackgroundDutyLocation } from './background-duty-location';
import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import { DutyLocation } from "./duty-location";
import { customFetch } from "../../../../lib/api-client-react/src/custom-fetch";
export function DriverDutySession() {
  const { isSignedIn, userId } = useAuth();
  useEffect(() => {
    if (!isSignedIn) dutyIntent.clear();
  }, [isSignedIn]);
  const profile = useAccountProfile();
  const enabled =
    !!isSignedIn && ["driver", "admin"].includes(profile.data?.role ?? "");
  const state = useQuery({
    queryKey: ["driver-availability", userId],
    queryFn: () =>
      customFetch<{
        approved: boolean;
        available: boolean;
        online: boolean;
        activeOrderId: string | null;
      }>("/api/driver/availability"),
    enabled,
    refetchInterval: 15000,
  });
  const [error, setError] = useState("");
  const [background, setBackground] = useState(false), [consent, setConsent] = useState(false);
  const foreground = useAppForeground();
  const intent = useDutyIntent(userId ?? null);
  const active =
    enabled &&
    !state.isError &&
    !profile.isError &&
    intent &&
    !!state.data?.approved &&
    !!state.data?.available &&
    !!state.data?.online;
  const backgroundFailure = useCallback((message: string) => {
    setError(message);
    if (userId) dutyIntent.set(userId, false);
  }, [userId]);
  useEffect(() => { if (!active) { setBackground(false); setConsent(false); } }, [active]);
  useEffect(() => {
    if (!active || !foreground) return;
    let disposed = false;
    const heartbeat = () => {
      void customFetch("/api/driver/heartbeat", {
        method: "POST",
      })
        .then(() => {
          if (!disposed) setError("");
        })
        .catch(() => {
          if (!disposed)
            setError(
              "Dispatch connection interrupted. Offers will pause until the connection recovers.",
            );
        });
    };
    heartbeat();
    const timer = setInterval(heartbeat, 30000);
    return () => {
      disposed = true;
      clearInterval(timer);
    };
  }, [active, userId, foreground]);
  if (!active) return error ? <aside className="roco-alert" role="alert">{error}</aside> : null;
  return (
    <aside className="roco-notice" aria-label="On-duty location status">
      <strong>You are on duty.</strong>
      {background ? <BackgroundDutyLocation onFatal={backgroundFailure}/> : <DutyLocation
        key={userId}
        available={active}
        activeOrderId={state.data?.activeOrderId ?? null}
      />}
      {import.meta.env.VITE_APP_AUDIENCE === 'driver' && Capacitor.isNativePlatform() && <section aria-label="Background location permission">
        {!background ? <><label className="roco-field"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}/>I want to share my driver location with authorized dispatch and active order participants while this app is in the background during this on-duty session.</label><button className="roco-button" disabled={!consent} onClick={() => { setError(''); setBackground(true); }}>Enable background location for this session</button></> : <button className="roco-button" onClick={() => { setBackground(false); setConsent(false); }}>Stop background sharing; use foreground only</button>}
      </section>}
      {error && <p role="alert">{error}</p>}
    </aside>
  );
}
