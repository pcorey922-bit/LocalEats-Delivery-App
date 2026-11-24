import { nativeStep } from '../lib/native-startup';
import { useAccountProfile } from '../hooks/use-account-profile';
import { dutyIntent } from "../lib/duty-intent";
import { useDutyIntent } from "../hooks/use-duty-intent";
import { useAppForeground } from "../hooks/use-app-foreground";
import { useCallback, useEffect, useState } from "react";
import { Capacitor } from '@capacitor/core';
import { BackgroundDutyLocation } from './background-duty-location';
import { useAuth,usesNativeClerk } from "../lib/auth";
import { useDriverAvailability } from '../hooks/use-driver-availability';
import { accountReadMessage } from '../lib/account-read';
import { accountStatus } from '../lib/account-entry';
import { DriverAvailabilityResponseError } from '../lib/driver-availability';
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
  const state = useDriverAvailability(enabled);
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
  const phase = !isSignedIn ? 'DRIVER_SIGN_IN_REQUIRED'
    : profile.isError ? 'DRIVER_PROFILE_ERROR'
    : !profile.data ? 'DRIVER_PROFILE_PENDING'
    : !enabled ? 'DRIVER_ROLE_REQUIRED'
    : state.isError ? (state.error instanceof DriverAvailabilityResponseError ? 'DRIVER_AVAILABILITY_RESPONSE_INVALID' : `DRIVER_AVAILABILITY_HTTP_${accountStatus(state.error) ?? 'UNKNOWN'}`)
    : !state.data ? 'DRIVER_AVAILABILITY_PENDING'
    : !state.data.approved ? 'DRIVER_APPROVAL_REQUIRED'
    : !intent ? 'DRIVER_DEVICE_RECONNECT_REQUIRED'
    : !state.data.available || !state.data.online ? 'DRIVER_CONNECTION_EXPIRED'
    : !Capacitor.isNativePlatform() ? 'DRIVER_READY_WEB'
    : background ? 'DRIVER_BACKGROUND_REQUESTED' : 'DRIVER_READY_NATIVE';
  useEffect(() => { if (userId) dutyIntent.report(userId, phase); }, [userId, phase]);
  useEffect(() => () => { if (userId) dutyIntent.report(userId, 'DRIVER_SESSION_STOPPED'); }, [userId]);
  const backgroundFailure = useCallback((message: string) => {
    setError(message);
    if (userId) dutyIntent.set(userId, false);
  }, [userId]);
  useEffect(() => { if (!active) { setBackground(false); setConsent(false); } }, [active]);
  useEffect(() => {
    if (!active || !foreground || background && usesNativeClerk()) return;
    let disposed = false, inFlight = false;
    const controller = new AbortController();
    const heartbeat = () => {
      if (disposed || inFlight) return;
      inFlight = true;
      const request = new AbortController();
      void nativeStep('NATIVE_DRIVER_HEARTBEAT_TIMEOUT', () => customFetch("/api/driver/heartbeat", {
        method: "POST", signal: request.signal,
      }), controller.signal)
        .then(() => {
          if (!disposed) setError("");
        })
        .catch(() => {
          if (!disposed)
            setError(
              "Dispatch connection interrupted. Offers will pause until the connection recovers.",
            );
        })
        .finally(() => { request.abort(); inFlight = false; });
    };
    heartbeat();
    const timer = setInterval(heartbeat, 30000);
    return () => {
      disposed = true;
      controller.abort();
      clearInterval(timer);
    };
  }, [active, userId, foreground, background]);
  if (!active) {
    if (error) return <aside className="roco-alert" role="alert">{error}</aside>;
    if (import.meta.env.VITE_APP_AUDIENCE !== 'driver' || !isSignedIn) return null;
    // Never silently omit the reason activation is unavailable. Safe gate codes
    // contain no identity, token, coordinates or raw provider response.
    const reason = profile.isError ? 'Account access could not be checked. Open Account access or retry the workspace. Code: DRIVER_PROFILE_ERROR.'
      : !profile.data ? 'Checking driver account access. Code: DRIVER_PROFILE_PENDING.'
      : !enabled ? 'An authorized driver or administrator account is required. Code: DRIVER_ROLE_REQUIRED.'
      : state.isError ? `Driver availability could not be checked. Code: ${phase}. ${accountReadMessage(state.error)}`
      : !state.data ? 'Checking driver availability. Code: DRIVER_AVAILABILITY_PENDING.'
      : !state.data.approved ? 'Server driver approval is required. Code: DRIVER_APPROVAL_REQUIRED.'
      : !intent ? 'This app has not reconnected for this session. Reconnect under Your availability to enable background setup. Code: DRIVER_DEVICE_RECONNECT_REQUIRED.'
      : !state.data.available || !state.data.online ? 'Dispatch connection is offline or expired. Reconnect under Your availability. Code: DRIVER_CONNECTION_EXPIRED.'
      : 'Driver connection could not be verified. Retry availability.';
    return <aside className="roco-notice" aria-label="Driver connection status"><strong>Background sharing is off.</strong><p role="status">{reason}</p></aside>;
  }
  return (
    <aside className="roco-notice" aria-label="On-duty location status">
      <strong>You are on duty.</strong>
      {background ? <BackgroundDutyLocation onFatal={backgroundFailure}/> : <DutyLocation
        key={userId}
        available={active}
        activeOrderId={state.data?.activeOrderId ?? null}
      />}
      {import.meta.env.VITE_APP_AUDIENCE === 'driver' && Capacitor.isNativePlatform() && (
        <section id="driver-background-sharing" aria-label="Background location permission">
          {!background ? <>
            <p><strong>Foreground-only location sharing</strong></p>
            <p>Go online does not enable background sharing. Keep RoCoEats visible, or enable background location below before switching apps or locking your screen. Without updates, dispatch marks you offline after 90 seconds and requires reconnecting.</p>
            <p>Start sharing while this app is open. On Android, allow notifications and wait for the RoCoEats on-duty notification before leaving the app. “Allow only while using the app” supports this foreground service; “Allow all the time” is not required.</p>
            <label className="roco-field">
              <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}/>
              I want to share my driver location with authorized dispatch and active order participants while this app is in the background during this on-duty session.
            </label>
            <button className="roco-button" disabled={!consent} onClick={() => { setError(''); setBackground(true); }}>Enable background location for this session</button>
          </> : <button className="roco-button" onClick={() => { setBackground(false); setConsent(false); }}>Stop background sharing; use foreground only</button>}
        </section>
      )}
      {import.meta.env.VITE_APP_AUDIENCE === 'driver' && !Capacitor.isNativePlatform() && <p role="status">Background location requires the installed Driver app. Code: DRIVER_NATIVE_PLATFORM_UNAVAILABLE.</p>}
      {error && <p role="alert">{error}</p>}
    </aside>
  );
}
