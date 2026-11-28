import { useEffect, useRef } from "react";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";

// Every shortcut targets an existing, authorization-protected management view.
const destinations = [
  [
    "Manage Orders",
    "/operations#orders",
    "Track orders, cancellations and refunds.",
  ],
  [
    "Manage Restaurants",
    "/admin?tab=restaurants",
    "Review restaurant applications and access.",
  ],
  [
    "Manage Drivers",
    "/operations#drivers",
    "Review applications and dispatch eligibility.",
  ],
  [
    "Dispatch Map",
    "/operations#dispatch",
    "See driver locations and delivery assignments.",
  ],
  [
    "Payments and Earnings",
    "/operations#payments",
    "Review the ledger, refunds and settlements.",
  ],
  [
    "System Operations",
    "/operations#system",
    "Check service health and protected diagnostics.",
  ],
  ["Notifications", "/notifications", "Read your account notifications."],
  [
    "Support",
    "/operations#support",
    "Review and respond to customer support cases.",
  ],
] as const;

export function OwnerWorkspaceLinks() {
  return (
    <nav className="roco-owner-links" aria-label="Business management">
      {destinations.map(([label, href, description]) => (
        <a href={href} key={href}>
          <strong>
            {label}
            <span aria-hidden="true"> →</span>
          </strong>
          <span>{description}</span>
        </a>
      ))}
    </nav>
  );
}

export function useOwnerAnchor(ready: boolean) {
  const fetching = useIsFetching();
  const client = useQueryClient();
  const aligned = useRef(false);
  useEffect(() => {
    if (!ready || fetching || aligned.current || !window.location.hash) return;
    // Wait for the initial records above the destination to finish loading.
    // Otherwise new driver/status cards move the requested section after scrolling.
    const frame = requestAnimationFrame(() => {
      if (client.isFetching()) return;
      const destination = document.getElementById(
        window.location.hash.slice(1),
      );
      if (!destination) return;
      destination.scrollIntoView({ behavior: "instant", block: "start" });
      aligned.current = true; // Background polling must never move the owner again.
    });
    return () => cancelAnimationFrame(frame);
  }, [ready, fetching, client]);
}
