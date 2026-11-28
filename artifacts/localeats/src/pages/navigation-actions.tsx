import { useState } from "react";
import { Capacitor } from "@capacitor/core";
import { navigationLinks, type NavigationAddress } from "../lib/navigation";
export function NavigationActions({
  label,
  address,
}: {
  label: string;
  address: NavigationAddress | null | undefined;
}) {
  const [message, setMessage] = useState("");
  const links = navigationLinks(address);
  const ios =
    Capacitor.getPlatform() === "ios" ||
    /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (!links)
    return (
      <p role="status">
        {label}: the complete destination is unavailable. Contact operations
        before navigating.
      </p>
    );
  return (
    <section aria-label={label}>
      <h4>{label}</h4>
      <p>{links.destination}</p>
      <div className="roco-row">
        <a
          className="roco-button"
          href={links.google}
          target="_blank"
          rel="noopener noreferrer"
        >
          Google Maps
        </a>
        {ios && (
          <a
            className="roco-button"
            href={links.apple}
            target="_blank"
            rel="noopener noreferrer"
          >
            Apple Maps
          </a>
        )}
        <button
          className="roco-button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(links.destination);
              setMessage("Address copied. Paste it into your navigation app.");
            } catch {
              setMessage(
                "Copy is unavailable. Select the address above and paste it into your preferred maps app.",
              );
            }
          }}
        >
          Copy destination
        </button>
      </div>
      <p className="roco-meta">
        Google Maps can open directions in your browser if its app is
        unavailable. Review the destination before driving.
      </p>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
