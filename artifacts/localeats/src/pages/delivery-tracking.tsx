import { useDutyIntent } from "../hooks/use-duty-intent";
import { dutyIntent } from "../lib/duty-intent";
import { NavigationActions } from "./navigation-actions";
import type { NavigationAddress } from "../lib/navigation";
import { useAuth } from "@clerk/react";
import { DispatchMap, type DispatchDriver } from "./dispatch-map";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Geolocation } from "@capacitor/geolocation";
import { customFetch } from "../../../../lib/api-client-react/src/custom-fetch";
export function DriverAvailability() {
  const { userId } = useAuth();
  const intent = useDutyIntent(userId ?? null);
  const client = useQueryClient();
  const state = useQuery({
    queryKey: ["driver-availability", userId],
    queryFn: () =>
      customFetch<{
        approved: boolean;
        online: boolean;
        available: boolean;
        activeOrderId: string | null;
      }>("/api/driver/availability"),
    refetchInterval: 15000,
  });
  const [error, setError] = useState("");
  const update = useMutation({
    mutationFn: (available: boolean) => {
      if (!available && userId) dutyIntent.set(userId, false);
      return customFetch("/api/driver/availability", {
        method: "PUT",
        body: JSON.stringify({ available }),
      });
    },
    onSuccess: (_data, available) => {
      if (userId) dutyIntent.set(userId, available);
      setError("");
      void client.invalidateQueries({ queryKey: ["driver-availability"] });
      void client.invalidateQueries({ queryKey: ["driver-offers"] });
    },
    onError: (e) => setError(e.message),
  });
  return (
    <section className="roco-card">
      <h2>Your availability</h2>
      <p>
        Going online shares your current location with authorized dispatch while
        the driver workspace is active. Going offline stops routine sharing and
        clears the dispatch position.
      </p>

      <p>
        {state.data?.online
          ? "Online — ready for offers"
          : "Offline — new deliveries will not be assigned"}
      </p>
      <p>
        {state.data?.activeOrderId
          ? "You have an active delivery. Complete or release it before taking another."
          : "One active delivery at a time."}
      </p>
      <button
        className="roco-button primary"
        disabled={
          update.isPending || (!state.data?.approved && !state.data?.available)
        }
        onClick={() => update.mutate(!(state.data?.online && intent))}
      >
        {state.data?.online && intent
          ? "Go offline"
          : state.data?.available
            ? "Reconnect on this device"
            : "Go online"}
      </button>
      {state.data?.available && !(state.data?.online && intent) && (
        <button
          className="roco-button"
          disabled={update.isPending}
          onClick={() => update.mutate(false)}
        >
          Go offline everywhere
        </button>
      )}
      {error && (
        <p role="alert" className="roco-alert">
          {error}
        </p>
      )}
      {state.error && (
        <p role="alert" className="roco-alert">
          {state.error.message}
        </p>
      )}
    </section>
  );
}
export function DriverLocationControl({ orderId }: { orderId: string }) {
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState("");
  const [lastSent, setLastSent] = useState<number | null>(null);
  const lastAttempt = useRef(0);
  useEffect(() => {
    if (!sharing) return;
    let disposed = false;
    let watchId: string | undefined;
    void Geolocation.watchPosition(
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
      (position, failure) => {
        if (disposed) return;
        if (failure || !position) {
          setError(
            "Location unavailable. Check device permission and GPS signal.",
          );
          return;
        }
        if (Date.now() - lastAttempt.current < 15000) return;
        lastAttempt.current = Date.now();
        void customFetch(`/api/driver/orders/${orderId}/location`, {
          method: "POST",
          body: JSON.stringify({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracyMeters: position.coords.accuracy,
            observedAt: new Date(position.timestamp).toISOString(),
          }),
        })
          .then(() => {
            if (!disposed) {
              setError("");
              setLastSent(Date.now());
            }
          })
          .catch(() => {
            if (!disposed)
              setError(
                "Location update could not be sent. Sharing resumes when the connection returns.",
              );
          });
      },
    )
      .then((id) => {
        watchId = id;
        if (disposed) void Geolocation.clearWatch({ id });
      })
      .catch(() =>
        setError(
          "Location permission is required to share your delivery position.",
        ),
      );
    return () => {
      disposed = true;
      if (watchId) void Geolocation.clearWatch({ id: watchId });
    };
  }, [sharing, orderId]);
  return (
    <section>
      <button
        className="roco-button"
        aria-pressed={sharing}
        onClick={() => setSharing(!sharing)}
      >
        {sharing ? "Stop location sharing" : "Share delivery location"}
      </button>
      <p className="roco-meta">
        Location sharing works while this screen is active.{" "}
        {lastSent
          ? `Last sent ${new Date(lastSent).toLocaleTimeString()}.`
          : ""}
      </p>
      {error && (
        <p role="alert" className="roco-alert">
          {error}
        </p>
      )}
    </section>
  );
}
export function OrderTracking({ orderId }: { orderId: string }) {
  const tracking = useQuery({
    queryKey: ["tracking", orderId],
    queryFn: () =>
      customFetch<{
        status: string;
        driverAssigned: boolean;
        locationStatus: string;
        location: {
          latitude: number;
          longitude: number;
          accuracyMeters: number;
          observedAt: string;
        } | null;
      }>(`/api/orders/${orderId}/tracking`),
    refetchInterval: 10000,
  });
  return (
    <section aria-label="Delivery tracking">
      <h3>Delivery tracking</h3>
      {tracking.data?.location ? (
        <>
          <p>
            Location updated{" "}
            {new Date(tracking.data.location.observedAt).toLocaleTimeString()} ·
            reported accuracy{" "}
            {Math.round(tracking.data.location.accuracyMeters)} m
          </p>
          <a
            className="roco-button"
            target="_blank"
            rel="noreferrer"
            href={`https://www.google.com/maps/search/?api=1&query=${tracking.data.location.latitude},${tracking.data.location.longitude}`}
          >
            View driver's reported location
          </a>
        </>
      ) : (
        <p>
          {tracking.data?.locationStatus === "stale"
            ? "The last location is out of date. Waiting for a fresh update."
            : tracking.data?.driverAssigned
              ? "Driver assigned. Location has not been shared yet."
              : "Waiting for a driver."}
        </p>
      )}
      {tracking.error && (
        <p className="roco-alert" role="alert">
          Tracking is temporarily unavailable. Refreshing automatically.
        </p>
      )}
    </section>
  );
}
export function DispatchOperations() {
  const dispatch = useQuery({
    queryKey: ["admin-dispatch"],
    queryFn: () =>
      customFetch<{
        orders: Array<{
          orderId: string;
          status: string;
          restaurantName: string;
          driverProfileId: string | null;
          waitingMinutes: number;
          pickupStreet: string;
          pickupCity: string;
          pickupRegion: string;
          pickupPostalCode: string;
          deliveryAddress: NavigationAddress;
        }>;
        drivers: DispatchDriver[];
      }>("/api/admin/dispatch"),
    refetchInterval: 10000,
  });
  return (
    <section>
      <h2>Dispatch oversight</h2>
      {dispatch.data && <DispatchMap drivers={dispatch.data.drivers} />}
      {dispatch.error && (
        <p role="alert" className="roco-alert">
          {dispatch.error.message}
        </p>
      )}
      <p>
        {dispatch.data?.drivers.filter((d) => d.online).length ?? 0} approved
        drivers online
      </p>
      {dispatch.data?.orders.map((order) => (
        <article key={order.orderId} className="roco-card">
          <h3>{order.restaurantName}</h3>
          <NavigationActions
            label="Pickup destination"
            address={{
              street1: order.pickupStreet,
              city: order.pickupCity,
              region: order.pickupRegion,
              postalCode: order.pickupPostalCode,
            }}
          />
          <NavigationActions
            label="Delivery destination"
            address={order.deliveryAddress}
          />
          <p>
            {order.status.replaceAll("_", " ")} · placed {order.waitingMinutes}{" "}
            minutes ago ·{" "}
            {order.driverProfileId ? "driver assigned" : "no driver assigned"}
          </p>
          <p className="roco-meta">{order.orderId}</p>
          <OrderTracking orderId={order.orderId} />
        </article>
      ))}
    </section>
  );
}
