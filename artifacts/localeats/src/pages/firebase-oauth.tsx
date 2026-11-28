import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "../../../../lib/api-client-react/src/custom-fetch";
type Outcome = {
  authenticated?: boolean;
  code?: string;
  checkedAt: string;
  state?: string;
};
type Status = {
  ready: boolean;
  retryAfter: string | null;
  lastRun: Outcome | null;
};
export function FirebaseOAuthDiagnostic() {
  const [confirmed, setConfirmed] = useState(false);
  const client = useQueryClient();
  const access = useQuery({
    queryKey: ["firebase-oauth-owner"],
    queryFn: () =>
      customFetch<{ superAdministrator: boolean }>("/api/session/access"),
    retry: false,
  });
  const status = useQuery({
    queryKey: ["firebase-oauth"],
    queryFn: () => customFetch<Status>("/api/admin/firebase-oauth"),
    enabled: access.data?.superAdministrator === true,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const check = useMutation({
    mutationFn: () =>
      customFetch<Outcome>("/api/admin/firebase-oauth", {
        method: "POST",
        body: JSON.stringify({ confirmOAuthOnly: true }),
        signal: AbortSignal.timeout(15000),
      }),
    retry: false,
    onSettled: () => {
      setConfirmed(false);
      void client.invalidateQueries({ queryKey: ["firebase-oauth"] });
    },
  });
  if (access.data?.superAdministrator !== true) return null;
  const outcome = status.data?.lastRun ?? check.data;
  return (
    <section className="roco-card" aria-label="Firebase OAuth authentication">
      <h3>Firebase OAuth authentication</h3>
      <p>
        This requests a short-lived Google OAuth token, discards it, and records
        only a sanitized audit outcome. It never sends a notification. It does
        not verify FCM send permission or device delivery.
      </p>
      {status.isPending && <p role="status">Checking diagnostic readiness…</p>}
      {status.isError && (
        <p role="alert">Diagnostic readiness could not be loaded.</p>
      )}
      {status.data && !status.data.ready && (
        <p role="status">
          Unavailable: verify dedicated credentials, closed staging safeguards,
          and the ten-minute cooldown.
        </p>
      )}
      {status.data?.retryAfter && (
        <p>
          Next attempt no earlier than{" "}
          {new Date(status.data.retryAfter).toLocaleString()}. Refresh status
          after waiting.
        </p>
      )}
      <label className="roco-field">
        <span>
          <input
            type="checkbox"
            checked={confirmed}
            disabled={check.isPending}
            onChange={(event) => setConfirmed(event.target.checked)}
          />{" "}
          I authorize one OAuth-only authentication check. No notifications will
          be sent.
        </span>
      </label>
      <button
        className="roco-button"
        disabled={
          !confirmed ||
          status.data?.ready !== true ||
          status.isFetching ||
          check.isPending
        }
        onClick={() => check.mutate()}
      >
        {check.isPending
          ? "Checking Google OAuth…"
          : "Verify Google OAuth only"}
      </button>{" "}
      <button
        className="roco-button"
        disabled={check.isPending || status.isFetching}
        onClick={() => void status.refetch()}
      >
        Refresh OAuth status
      </button>
      {check.isError && (
        <p role="alert">
          Verification failed or its outcome is unconfirmed. No automatic retry
          occurred. Refresh status before another manually approved attempt.
        </p>
      )}
      {outcome && (
        <p role="status">
          {outcome.authenticated === true
            ? "Google OAuth authenticated. FCM permissions and device delivery remain unverified."
            : outcome.state === "unconfirmed"
              ? "Previous check started; completion is unconfirmed."
              : "Google OAuth authentication was not verified."}{" "}
          Observed {new Date(outcome.checkedAt).toLocaleString()}.
        </p>
      )}
    </section>
  );
}
