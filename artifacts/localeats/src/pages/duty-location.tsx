import { useEffect, useRef, useState } from "react";
import { Geolocation } from "@capacitor/geolocation";
import { useAppForeground } from "../hooks/use-app-foreground";
import { customFetch } from "../../../../lib/api-client-react/src/custom-fetch";
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
    attempt.current = 0;
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
        if (inFlight || Date.now() - attempt.current < 15000) return;
        attempt.current = Date.now();
        inFlight = true;
        const payload = JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: position.coords.accuracy,
          observedAt: new Date(position.timestamp).toISOString(),
        });
        void customFetch<{ accepted: boolean }>("/api/driver/location", {
          method: "POST",
          body: payload,
        })
          .then(async (result) => {
            if (!result.accepted) {
              if (!disposed)
                setMessage(
                  "Waiting for a newer GPS fix; the last position was not replaced.",
                );
              return;
            }
            if (activeOrderId)
              await customFetch(
                `/api/driver/orders/${activeOrderId}/location`,
                { method: "POST", body: payload },
              );
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
        Background tracking is not available in this build. Keep the driver
        workspace open for location updates.
      </p>
      {available && message && <p className="roco-alert">{message}</p>}
    </div>
  );
}
