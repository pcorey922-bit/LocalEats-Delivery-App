import { useEffect, useRef, useState } from "react";
export type DispatchDriver = {
  profileId: string;
  displayName: string;
  online: boolean;
  approved: boolean;
  status: string;
  activeOrderId: string | null;
  locationStatus: string;
  location: {
    latitude: number;
    longitude: number;
    accuracyMeters: number;
    observedAt: string;
  } | null;
};
type MapInstance = { fitBounds: (bounds: unknown, padding: number) => void };
type MarkerInstance = { map: MapInstance | null };
type MapsRuntime = {
  importLibrary: (library: string) => Promise<Record<string, unknown>>;
};
type MapsWindow = Window & {
  google?: { maps: MapsRuntime };
  __rocoDispatchMapsReady?: () => void;
};
let loader: Promise<MapsRuntime> | null = null;
function loadMaps(key: string) {
  if (loader) return loader;
  loader = new Promise<MapsRuntime>((resolve, reject) => {
    const w = window as MapsWindow;
    if (w.google?.maps) {
      resolve(w.google.maps);
      return;
    }
    const script = document.createElement("script");
    const fail = () => {
      window.clearTimeout(timer);
      delete w.__rocoDispatchMapsReady;
      script.remove();
      loader = null;
      reject(
        new Error(
          "Map provider could not load. Driver coordinates remain available below.",
        ),
      );
    };
    const timer = window.setTimeout(fail, 20000);
    w.__rocoDispatchMapsReady = () => {
      window.clearTimeout(timer);
      delete w.__rocoDispatchMapsReady;
      if (w.google?.maps) resolve(w.google.maps);
      else fail();
    };
    const url = new URL("https://maps.googleapis.com/maps/api/js");
    url.search = new URLSearchParams({
      key,
      v: "quarterly",
      loading: "async",
      callback: "__rocoDispatchMapsReady",
      libraries: "maps,marker",
    }).toString();
    script.src = url.href;
    script.async = true;
    script.onerror = fail;
    document.head.append(script);
  });
  return loader;
}
export function DispatchMap({ drivers }: { drivers: DispatchDriver[] }) {
  const element = useRef<HTMLDivElement>(null),
    map = useRef<MapInstance | null>(null),
    [error, setError] = useState("");
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim(),
    mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID?.trim();
  const configured = !!key && !!mapId && mapId !== "DEMO_MAP_ID";
  const visible = drivers.filter((d) => d.online && d.location);
  useEffect(() => {
    if (!configured || !visible.length) return;
    let disposed = false;
    const markers: MarkerInstance[] = [];
    void loadMaps(key!)
      .then(async (api) => {
        const [maps, marker, core] = await Promise.all([
          api.importLibrary("maps"),
          api.importLibrary("marker"),
          api.importLibrary("core"),
        ]);
        if (disposed || !element.current) return;
        const MapClass = maps.Map as new (
          e: HTMLElement,
          o: Record<string, unknown>,
        ) => MapInstance;
        const Marker = marker.AdvancedMarkerElement as new (
          o: Record<string, unknown>,
        ) => MarkerInstance;
        const Bounds = core.LatLngBounds as new () => {
          extend: (p: { lat: number; lng: number }) => void;
        };
        const first = visible[0].location!;
        const isNew = !map.current;
        if (!map.current)
          map.current = new MapClass(element.current, {
            center: { lat: first.latitude, lng: first.longitude },
            zoom: 13,
            mapId,
          });
        const bounds = new Bounds();
        for (const d of visible) {
          const p = { lat: d.location!.latitude, lng: d.location!.longitude };
          bounds.extend(p);
          const label = document.createElement("span");
          label.textContent = `${d.displayName} · ${d.status}${d.locationStatus === "stale" ? " · STALE" : ""}`;
          label.style.cssText = `background:${d.locationStatus === "stale" ? "#8b3b25" : "#142f49"};color:white;padding:7px 10px;border-radius:6px;font:12px system-ui`;
          markers.push(
            new Marker({
              map: map.current,
              position: p,
              content: label,
              title: label.textContent,
            }),
          );
        }
        if (isNew && visible.length > 1) map.current.fitBounds(bounds, 40);
        setError("");
      })
      .catch((e) => {
        if (!disposed)
          setError(e instanceof Error ? e.message : "Map unavailable");
      });
    return () => {
      disposed = true;
      for (const m of markers) m.map = null;
    };
  }, [drivers, key, mapId, configured]);
  return (
    <section aria-label="On-duty driver map">
      <h3>On-duty driver map</h3>
      {!configured ? (
        <p className="roco-notice">
          The live map requires an owner-controlled, origin-restricted Google
          Maps browser key and map ID. Current driver status and coordinates are
          available below.
        </p>
      ) : (
        <>
          <div
            ref={element}
            style={{
              width: "100%",
              height: 360,
              borderRadius: 12,
              background: "#edf0f2",
            }}
          />
          {!visible.length && (
            <p>No on-duty locations are currently available.</p>
          )}
          {error && <p role="alert">{error}</p>}
        </>
      )}
      {drivers.map((d) => (
        <article key={d.profileId} className="roco-card">
          <strong>
            {d.displayName} · {d.status}
          </strong>
          <p>
            {d.activeOrderId
              ? `Assigned order ${d.activeOrderId}`
              : "No active assignment"}{" "}
            · Location: {d.locationStatus.replaceAll("_", " ")}
          </p>
          {d.location && (
            <>
              <p>
                {d.location.latitude.toFixed(6)},{" "}
                {d.location.longitude.toFixed(6)} · accuracy{" "}
                {Math.round(d.location.accuracyMeters)} m ·{" "}
                {new Date(d.location.observedAt).toLocaleTimeString()}
              </p>
              <a
                className="roco-button"
                target="_blank"
                rel="noopener noreferrer"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${d.location.latitude},${d.location.longitude}`)}`}
              >
                Open reported location in Google Maps
              </a>
            </>
          )}
        </article>
      ))}
    </section>
  );
}
