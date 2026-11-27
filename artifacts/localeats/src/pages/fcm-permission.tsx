import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "../../../../lib/api-client-react/src/custom-fetch";
type Report = {
  authenticated: boolean;
  permissionValidated: boolean;
  code: string;
};
type Status = {
  ready: boolean;
  allowanceUsed: boolean;
  run: null | { state: string; report: Report | null };
};
export function FcmPermissionValidation() {
  const [confirmed, setConfirmed] = useState(false),
    client = useQueryClient();
  const access = useQuery({
    queryKey: ["firebase-oauth-owner"],
    queryFn: () =>
      customFetch<{ superAdministrator: boolean }>("/api/session/access"),
    retry: false,
  });
  const status = useQuery({
    queryKey: ["fcm-permission-validation"],
    queryFn: () => customFetch<Status>("/api/admin/fcm-permission-validation"),
    enabled: access.data?.superAdministrator === true,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const run = useMutation({
    mutationFn: () =>
      customFetch<Report>("/api/admin/fcm-permission-validation", {
        method: "POST",
        body: JSON.stringify({ confirmValidationOnly: true }),
        signal: AbortSignal.timeout(25000),
      }),
    retry: false,
    onSettled: () => {
      setConfirmed(false);
      void client.invalidateQueries({
        queryKey: ["fcm-permission-validation"],
      });
    },
  });
  if (access.data?.superAdministrator !== true) return null;
  const report = status.data?.run?.report ?? run.data;
  return (
    <section className="roco-card" aria-label="FCM permission validation">
      <h3>FCM permission validation — no delivery</h3>
      <p>
        This one-time check makes a fresh Google OAuth request and one FCM
        request with validation-only enabled. It uses a fixed staging topic,
        never a device token, and cannot deliver a notification. Separate
        approval is required before running it.
      </p>
      {status.isPending && (
        <p role="status">Checking permission diagnostic readiness…</p>
      )}
      {status.isError && (
        <p role="alert">Permission diagnostic status could not be loaded.</p>
      )}
      {status.data && !status.data.ready && !status.data.allowanceUsed && (
        <p role="status">
          Unavailable: dedicated credentials and closed staging safeguards are
          required.
        </p>
      )}
      {status.data?.allowanceUsed && (
        <p role="status">
          One-time allowance used. Do not repeat the check; refresh status to
          recover the outcome.
        </p>
      )}
      <label className="roco-field">
        <span>
          <input
            type="checkbox"
            checked={confirmed}
            disabled={run.isPending || status.data?.allowanceUsed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />{" "}
          I authorize one FCM validation-only permission check. No delivery.
        </span>
      </label>
      <button
        className="roco-button"
        disabled={
          !confirmed ||
          status.data?.ready !== true ||
          status.isFetching ||
          run.isPending
        }
        onClick={() => run.mutate()}
      >
        {run.isPending
          ? "Validating permission…"
          : "Validate FCM permission only"}
      </button>{" "}
      <button
        className="roco-button"
        disabled={run.isPending || status.isFetching}
        onClick={() => void status.refetch()}
      >
        Refresh FCM validation status
      </button>
      {run.isError && (
        <p role="alert">
          The result is failed or unconfirmed. No automatic retry occurred.
          Refresh status; do not repeat or change credentials.
        </p>
      )}
      {status.data?.run?.state === "unconfirmed" && (
        <p role="status">
          Validation started; completion is unconfirmed. Review the saved audit
          before any further action.
        </p>
      )}
      {report && (
        <p role="status">
          {report.permissionValidated
            ? "FCM permission validated without delivery. Device registration and actual notification receipt remain unverified."
            : "FCM permission remains unverified. Stop and investigate without retrying."}
        </p>
      )}
    </section>
  );
}
