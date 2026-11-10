import { dutyIntent } from "../lib/duty-intent";
import { useDutyIntent } from "../hooks/use-duty-intent";
import { useAppForeground } from "../hooks/use-app-foreground";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/react";
import {
  useGetMyProfile,
  getGetMyProfileQueryKey,
} from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { DutyLocation } from "./duty-location";
import { customFetch } from "../../../../lib/api-client-react/src/custom-fetch";
export function DriverDutySession() {
  const { isSignedIn, userId } = useAuth();
  useEffect(() => {
    if (!isSignedIn) dutyIntent.clear();
  }, [isSignedIn]);
  const profile = useGetMyProfile({
    query: {
      queryKey: [...getGetMyProfileQueryKey(), userId],
      enabled: !!isSignedIn,
      networkMode: "always",
      retry: false,
      retryOnMount: false,
    },
  });
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
  if (!active) return null;
  return (
    <aside className="roco-notice" aria-label="On-duty location status">
      <strong>You are on duty.</strong>
      <DutyLocation
        key={userId}
        available={active}
        activeOrderId={state.data?.activeOrderId ?? null}
      />
      {error && <p role="alert">{error}</p>}
    </aside>
  );
}
