import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "../../../../lib/api-client-react/src/custom-fetch";
import { useAuth } from "@clerk/react";
type Application = {
  profileId: string;
  phone: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  licenseState: string;
  licenseExpiresOn: string;
  status: string;
  version: number;
  reviewNote: string | null;
};
export function DriverApplication() {
  const { userId } = useAuth();
  const access = useQuery({
    queryKey: ["driver-availability", userId],
    queryFn: () =>
      customFetch<{ ownerDriverAccess: boolean; approved: boolean }>(
        "/api/driver/availability",
      ),
    enabled: !!userId,
  });
  const q = useQuery({
    queryKey: ["driver-application", userId],
    queryFn: () => customFetch<Application | null>("/api/driver/application"),
  });
  const client = useQueryClient();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [edit, setEdit] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      await customFetch("/api/driver/application", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: f.get("phone"),
          vehicleMake: f.get("vehicleMake"),
          vehicleModel: f.get("vehicleModel"),
          vehicleYear: Number(f.get("vehicleYear")),
          licenseState: f.get("licenseState"),
          licenseExpiresOn: f.get("licenseExpiresOn"),
          eligibilityAttested: f.get("eligibility") === "on",
          insuranceAttested: f.get("insurance") === "on",
        }),
      });
      await client.invalidateQueries({ queryKey: ["driver-application"] });
      await client.invalidateQueries({ queryKey: ["driver-availability"] });
      setEdit(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to submit application");
    } finally {
      setBusy(false);
    }
  }
  if (q.isLoading)
    return <section className="roco-card">Loading application…</section>;
  if (q.isError)
    return (
      <section className="roco-card">
        <p>Application could not be loaded.</p>
        <button onClick={() => void q.refetch()}>Retry</button>
      </section>
    );
  const a = q.data;
  return (
    <section className="roco-card">
      <h2>Driver application</h2>
      {access.data?.ownerDriverAccess && (
        <p className="roco-notice">
          Your server-configured owner account can drive without submitting or
          approving its own application. Vehicle details are optional here. A
          recorded expired license must be updated before going on duty; valid
          licensing and insurance remain your responsibility. Owner access is
          separate from screening or insurance verification.
        </p>
      )}
      <p>
        {a
          ? `Application status: ${a.status}`
          : "Tell us about your vehicle and delivery eligibility."}
      </p>
      {a?.reviewNote && <p>Review: {a.reviewNote}</p>}
      {(a || access.data?.ownerDriverAccess) && !edit ? (
        <button className="roco-button" onClick={() => setEdit(true)}>
          {a ? "Update application" : "Add optional vehicle details"}
        </button>
      ) : (
        <form onSubmit={submit}>
          <p>
            Do not enter a Social Security number, license number, bank details
            or identity documents here. Identity and screening checks are
            reviewed separately by operations.
          </p>
          {[
            ["phone", "Contact phone", "tel"],
            ["vehicleMake", "Vehicle make", "text"],
            ["vehicleModel", "Vehicle model", "text"],
            ["vehicleYear", "Vehicle year", "number"],
            ["licenseState", "License issuing state (two letters)", "text"],
            ["licenseExpiresOn", "License expiry", "date"],
          ].map(([name, label, type]) => (
            <label style={{ display: "block", margin: "12px 0" }} key={name}>
              {label}
              <input
                className="roco-input"
                name={name}
                type={type}
                required
                defaultValue={a?.[name as keyof Application] ?? ""}
                maxLength={name === "licenseState" ? 2 : 80}
              />
            </label>
          ))}
          <label style={{ display: "block" }}>
            <input type="checkbox" name="eligibility" required /> I hold a valid
            license and am eligible to perform deliveries.
          </label>
          <label style={{ display: "block" }}>
            <input type="checkbox" name="insurance" required /> I maintain
            insurance appropriate for my delivery activity.
          </label>
          <p>
            {access.data?.ownerDriverAccess
              ? "Updating details does not require self-approval. Reconnect explicitly afterward to resume sharing your location."
              : "Submitting changes pauses dispatch access until the updated application is approved."}
          </p>
          <button className="roco-button primary" disabled={busy}>
            {busy
              ? "Submitting…"
              : access.data?.ownerDriverAccess
                ? "Save vehicle details"
                : "Submit for review"}
          </button>
        </form>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
function Review({
  application: a,
  name,
  onSaved,
}: {
  application: Application;
  name: string;
  onSaved: () => void;
}) {
  const [checks, setChecks] = useState({
      identityChecked: false,
      screeningChecked: false,
      insuranceChecked: false,
    }),
    [note, setNote] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function review(approved: boolean) {
    setBusy(true);
    try {
      await customFetch(
        `/api/admin/driver-applications/${a.profileId}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...checks,
            version: a.version,
            approved,
            note,
          }),
        },
      );
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Review failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="roco-card">
      <h3>
        {name} · {a.status}
      </h3>
      <p>
        {a.vehicleYear} {a.vehicleMake} {a.vehicleModel} · Contact: {a.phone}
      </p>
      <p>
        License state: {a.licenseState} · Expires: {a.licenseExpiresOn}
      </p>
      {a.status === "pending" ? (
        <>
          <p>
            Complete the external checks before approving. Attestations do not
            perform identity or background screening automatically.
          </p>
          {(Object.keys(checks) as (keyof typeof checks)[]).map((k) => (
            <label key={k} style={{ display: "block" }}>
              <input
                type="checkbox"
                checked={checks[k]}
                onChange={(e) =>
                  setChecks((c) => ({ ...c, [k]: e.target.checked }))
                }
              />
              {k === "identityChecked"
                ? "Identity and license verified"
                : k === "screeningChecked"
                  ? "Required screening completed"
                  : "Insurance reviewed"}
            </label>
          ))}
          <label>
            Review evidence reference and decision note (no sensitive
            identifiers)
            <textarea
              className="roco-input"
              value={note}
              maxLength={1000}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <div className="roco-row">
            <button
              className="roco-button primary"
              disabled={
                busy ||
                note.trim().length < 10 ||
                !Object.values(checks).every(Boolean)
              }
              onClick={() => void review(true)}
            >
              Approve driver
            </button>
            <button
              className="roco-button danger"
              disabled={busy || note.trim().length < 10}
              onClick={() => void review(false)}
            >
              Reject application
            </button>
          </div>
        </>
      ) : (
        <p>{a.reviewNote}</p>
      )}
      {error && <p role="alert">{error}</p>}
    </article>
  );
}
export function DriverApplicationReviews() {
  const client = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-driver-applications"],
    queryFn: () =>
      customFetch<{ application: Application; displayName: string }[]>(
        "/api/admin/driver-applications",
      ),
  });
  return (
    <section>
      <h2>Driver applications</h2>
      {q.isLoading ? (
        <p>Loading applications…</p>
      ) : q.isError ? (
        <p>
          Unable to load applications.{" "}
          <button onClick={() => void q.refetch()}>Retry</button>
        </p>
      ) : !q.data?.length ? (
        <p>No driver applications submitted.</p>
      ) : (
        q.data.map((r) => (
          <Review
            key={`${r.application.profileId}:${r.application.version}:${r.application.status}`}
            application={r.application}
            name={r.displayName}
            onSaved={() => {
              void client.invalidateQueries({
                queryKey: ["admin-driver-applications"],
              });
              void client.invalidateQueries({
                queryKey: ["admin-driver-approvals"],
              });
            }}
          />
        ))
      )}
    </section>
  );
}
