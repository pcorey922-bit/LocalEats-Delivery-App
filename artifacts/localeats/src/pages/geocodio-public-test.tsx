import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "../../../../lib/api-client-react/src/custom-fetch";
type State = {
  enabled: boolean;
  keyConfigured: boolean;
  ready: boolean;
  safeguards: Record<string, boolean>;
  run: null | {
    state: string;
    report: {
      requestsMade: number;
      coverageGaps: string[];
      cases: Array<{
        id: string;
        status: string;
        expectationMet?: boolean | null;
      }>;
    } | null;
  };
};
export function GeocodioPublicTest() {
  const [confirmed, setConfirmed] = useState(false);
  const client = useQueryClient();
  const access = useQuery({
    queryKey: ["geocodio-owner-access"],
    queryFn: () =>
      customFetch<{ superAdministrator: boolean }>("/api/session/access"),
    retry: false,
  });
  const status = useQuery({
    queryKey: ["geocodio-public-test"],
    queryFn: () => customFetch<State>("/api/admin/geocodio-public-test"),
    enabled: access.data?.superAdministrator === true,
    retry: false,
  });
  const check = useMutation({
    mutationFn: () =>
      customFetch<State>("/api/admin/geocodio-public-test", {
        method: "POST",
        body: JSON.stringify({ freeTierConfirmed: true }),
      }),
    retry: false,
    onSuccess: (data) => {
      client.setQueryData(["geocodio-public-test"], data);
      setConfirmed(false);
    },
    onSettled: () =>
      client.invalidateQueries({ queryKey: ["geocodio-public-test"] }),
  });
  if (access.data?.superAdministrator !== true) return null;
  const current = status.data;
  return (
    <section className="roco-card" aria-label="Public Geocodio verification">
      <h2>Public Geocodio verification</h2>
      <p>
        Owner only. One run of at most five fixed public addresses. No customer
        addresses, payments, ordering or geographic activation. Never enter an
        API key here.
      </p>
      {status.isLoading && <p role="status">Loading verification status…</p>}
      {status.isError && (
        <p role="alert">
          Status unavailable. Refresh status before doing anything else.
        </p>
      )}
      {current && (
        <>
          <p>
            Server test enabled: {current.enabled ? "Yes" : "No"}. Server key
            configured: {current.keyConfigured ? "Yes" : "No"}.
          </p>
          {!Object.values(current.safeguards).every(Boolean) && (
            <p role="alert">
              Required safety gates are not satisfied. The test is blocked.
            </p>
          )}
          {current.run ? (
            <>
              <p role="status">
                Allowance used · {current.run.state}. No further provider calls
                will be made.
              </p>
              {!current.run.report && (
                <p>
                  The run may be in progress or interrupted. Refresh status. Do
                  not repeat the test or reset its allowance.
                </p>
              )}
              {current.run.report && (
                <>
                  <p>
                    Provider requests attempted:{" "}
                    {current.run.report.requestsMade}. This report does not
                    authorize geographic activation.
                  </p>
                  <ul>
                    {current.run.report.cases.map((row) => (
                      <li key={row.id}>
                        {row.id}: {row.status}
                        {row.expectationMet === false
                          ? " — review required"
                          : ""}
                      </li>
                    ))}
                  </ul>
                  <details>
                    <summary>Sanitized provider report</summary>
                    <pre
                      style={{
                        whiteSpace: "pre-wrap",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {JSON.stringify(current.run.report, null, 2)}
                    </pre>
                  </details>
                </>
              )}
            </>
          ) : (
            <>
              {!current.ready && (
                <p>
                  Disabled until the separately approved server configuration is
                  ready.
                </p>
              )}
              <label style={{ display: "flex", gap: 12, padding: "12px 0" }}>
                <input
                  type="checkbox"
                  checked={confirmed}
                  disabled={
                    !current.ready ||
                    check.isPending ||
                    status.isFetching ||
                    status.isError
                  }
                  onChange={(event) => setConfirmed(event.target.checked)}
                />
                I confirm no payment method, paid credits or auto-refill, and at
                least five free Geocodio lookups remain.
              </label>
              <button
                className="roco-button"
                disabled={
                  !confirmed ||
                  !current.ready ||
                  check.isPending ||
                  status.isFetching ||
                  status.isError
                }
                onClick={() => check.mutate()}
              >
                {check.isPending
                  ? "Checking public addresses…"
                  : "Run public address verification once"}
              </button>
            </>
          )}
        </>
      )}
      <button
        className="roco-button"
        disabled={status.isFetching || check.isPending}
        onClick={() => void status.refetch()}
      >
        Refresh verification status
      </button>
      {check.isError && (
        <p role="alert">
          The request did not finish normally. Refresh status before continuing.
          The server prevents a second run.
        </p>
      )}
    </section>
  );
}
