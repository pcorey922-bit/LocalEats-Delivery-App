import { nativeStep } from '../lib/native-startup';
import { useEffect, useRef, useState } from "react";
import { Geolocation } from "@capacitor/geolocation";
import { useAppForeground } from "../hooks/use-app-foreground";
import { customFetch } from "../../../../lib/api-client-react/src/custom-fetch";
import { Capacitor } from '@capacitor/core';
export function DutyLocation({
  available,
  activeOrderId,
}: {
  available: boolean;
  activeOrderId: string | null;
}) {
  const foreground = useAppForeground();
  const [message, setMessage] = useState(""),
    [lastSent, setLastSent] = useState<number | null>(null);
  const attempt = useRef(0);
  useEffect(() => {
    if (!available || !foreground) return;
    let disposed = false,
      watch: string | undefined,
      inFlight = false;
    const controller = new AbortController();
    attempt.current = 0;
    async function upload<T>(path: string, body: string): Promise<T> {
      const request = new AbortController();
      try {
        return await nativeStep('NATIVE_LOCATION_REQUEST_TIMEOUT', () =>
          customFetch<T>(path, { method: 'POST', body, signal: request.signal }), controller.signal);
      } finally { request.abort(); }
    }
    void Geolocation.watchPosition(
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
      (position, error) => {
        if (disposed) return;
        if (error || !position) {
          setMessage(
            "GPS unavailable. Check location permissions and signal; dispatch will see a missing or stale-location warning.",
          );
          return;
        }
        const coords = position.coords, age = Date.now() - position.timestamp;
        if (!coords || ![coords.latitude, coords.longitude, coords.accuracy, position.timestamp].every(Number.isFinite) ||
            Math.abs(coords.latitude) > 90 || Math.abs(coords.longitude) > 180 || coords.accuracy < 0 || coords.accuracy > 10000 ||
            age > 120000 || age < -30000) {
          setMessage('GPS fix rejected: a fresh, valid device position is required.');
          return;
        }
        if (inFlight || Date.now() - attempt.current < 15000) return;
        attempt.current = Date.now();
        inFlight = true;
        const payload = JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: position.coords.accuracy,
          observedAt: new Date(position.timestamp).toISOString(),
        });
        void upload<{ accepted: boolean }>("/api/driver/location", payload)
          .then(async (result) => {
            if (disposed) return;
            if (!result || typeof result.accepted !== 'boolean') throw new Error('Invalid location acknowledgement');
            if (!result.accepted) {
              setMessage(
                "Waiting for a newer GPS fix; the last position was not replaced.",
              );
              return;
            }
            if (activeOrderId) {
              await upload(
                `/api/driver/orders/${encodeURIComponent(activeOrderId)}/location`, payload,
              );
            }
            if (!disposed) {
              setLastSent(Date.now());
              setMessage("");
            }
          })
          .catch(() => {
            if (!disposed)
              setMessage(
                "Location upload failed. Retrying on the next GPS update.",
              );
          })
          .finally(() => {
            inFlight = false;
          });
      },
    )
      .then((id) => {
        if (disposed) void Geolocation.clearWatch({ id }).catch(() => {});
        else watch = id;
      })
      .catch(() => {
        if (!disposed)
          setMessage(
            "Location permission is required. Enable it in device settings and return to this screen.",
          );
      });
    return () => {
      disposed = true;
      controller.abort();
      if (watch) void Geolocation.clearWatch({ id: watch }).catch(() => {});
    };
  }, [available, foreground, activeOrderId]);
  return (
    <div role="status">
      <p>
        {!available
          ? "On-duty location sharing is stopped."
          : !foreground
            ? "Foreground GPS sharing is paused while the app is in the background."
            : "Your current location is shared with authorized dispatch while RoCoEats is active."}
      </p>
      <p className="roco-meta">
        {available && lastSent
          ? `Last successful upload ${new Date(lastSent).toLocaleTimeString()}. `
          : ""}
        {import.meta.env.VITE_APP_AUDIENCE === 'driver' && Capacitor.isNativePlatform()
          ? 'Background sharing is off. You can explicitly enable it for this session below.'
          : 'Keep the driver workspace open for location updates. Background sharing requires the dedicated driver app and separate consent.'}
      </p>
      {available && message && <p className="roco-alert">{message}</p>}
    </div>
  );
}
