import { useEffect } from "react";

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
  useEffect(() => {
    if (!ready || !window.location.hash) return;
    const frame = requestAnimationFrame(() =>
      document
        .getElementById(window.location.hash.slice(1))
        ?.scrollIntoView({ behavior: "instant", block: "start" }),
    );
    return () => cancelAnimationFrame(frame);
  }, [ready]);
}
