import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "../../../../lib/api-client-react/src/custom-fetch";
import { SupportThread } from "./support-thread";
import { supportRequest, supportRecovery } from "../lib/support-request";
type Case = {
  id: string;
  orderId: string | null;
  category: string;
  subject: string;
  message: string;
  status: string;
  version: number;
  resolution: string | null;
  createdAt: string;
};
type Draft = {
  id: string;
  orderId?: string;
  category: string;
  subject: string;
  message: string;
};
type Decision = {
  id: string;
  version: number;
  status: string;
  resolution: string;
};
export function SupportDesk({ orderId }: { orderId?: string }) {
  const [open, setOpen] = useState(false),
    [id, setId] = useState(() => crypto.randomUUID()),
    [subject, setSubject] = useState(""),
    [message, setMessage] = useState(""),
    [attempt, setAttempt] = useState<Draft | null>(null),
    [notice, setNotice] = useState("");
  const client = useQueryClient();
  const q = useQuery({
    queryKey: ["my-support-cases"],
    queryFn: ({ signal }) =>
      supportRequest(
        (inner) => customFetch<Case[]>("/api/support/cases", { signal: inner }),
        { signal },
      ),
    retry: false,
    enabled: open,
    refetchInterval: open ? 30000 : false,
  });
  const send = useMutation({
    mutationFn: (draft: Draft) =>
      supportRequest((signal) =>
        customFetch("/api/support/cases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
          signal,
        }),
      ),
    retry: false,
    onSuccess: () => {
      setId(crypto.randomUUID());
      setSubject("");
      setMessage("");
      setAttempt(null);
      setNotice("");
      void client.invalidateQueries({ queryKey: ["my-support-cases"] });
    },
  });
  function submit(e: FormEvent) {
    e.preventDefault();
    const draft = attempt ?? {
      id,
      orderId,
      category: orderId ? "delivery" : "account",
      subject,
      message,
    };
    setAttempt(draft);
    setNotice("");
    send.mutate(draft);
  }
  async function review() {
    const result = await q.refetch();
    if (result.isError || !result.data || !attempt) return;
    const outcome = supportRecovery(attempt.id, result.data, send.error);
    if (outcome === "unconfirmed") {
      setNotice(
        "Request outcome is unconfirmed. Retry the same saved request; it may be outside the loaded history.",
      );
      return;
    }
    if (outcome === "confirmed") {
      setSubject("");
      setMessage("");
    }
    setAttempt(null);
    setId(crypto.randomUUID());
    send.reset();
    setNotice(
      outcome === "confirmed"
        ? "Saved request confirmed."
        : "Latest requests loaded. Review and edit your request before submitting again.",
    );
  }
  return (
    <section>
      <button className="roco-button" onClick={() => setOpen(!open)}>
        {open ? "Hide support" : "Get support"}
      </button>
      {open && (
        <section className="roco-card">
          <h3>Contact operations</h3>
          <p>
            Describe the issue without card numbers, bank details, passwords or
            government identifiers. A support request does not automatically
            cancel an order, issue a refund or confirm delivery.
          </p>
          <form onSubmit={submit}>
            <label>
              Subject
              <input
                className="roco-input"
                value={subject}
                disabled={send.isPending || !!attempt}
                minLength={3}
                maxLength={140}
                required
                onChange={(e) => setSubject(e.target.value)}
              />
            </label>
            <label>
              What happened?
              <textarea
                className="roco-input"
                value={message}
                disabled={send.isPending || !!attempt}
                minLength={10}
                maxLength={3000}
                required
                onChange={(e) => setMessage(e.target.value)}
              />
            </label>
            <button className="roco-button primary" disabled={send.isPending}>
              {attempt ? "Retry saved support request" : "Send support request"}
            </button>
          </form>
          {send.isSuccess && (
            <p role="status">
              Request received. Operations will review it here.
            </p>
          )}
          {send.isError && <p role="alert">{send.error.message}</p>}
          {notice && <p role="status">{notice}</p>}
          <button
            type="button"
            className="roco-button"
            disabled={send.isPending || q.isFetching}
            onClick={() => void review()}
          >
            Review latest requests
          </button>
          <h3>Your requests</h3>
          {q.isLoading ? (
            <p>Loading requests…</p>
          ) : q.isError ? (
            <button onClick={() => void q.refetch()}>
              Retry loading requests
            </button>
          ) : (
            q.data
              ?.filter((c) => !orderId || c.orderId === orderId)
              .map((c) => (
                <article key={c.id}>
                  <strong>
                    {c.subject} · {c.status.replaceAll("_", " ")}
                  </strong>
                  <p>{c.message}</p>
                  {c.resolution && <p>Operations response: {c.resolution}</p>}
                  <SupportThread caseId={c.id} />
                </article>
              ))
          )}
        </section>
      )}
    </section>
  );
}
function SupportReview({
  entry,
  onSaved,
}: {
  entry: Case;
  onSaved: () => void;
}) {
  const [note, setNote] = useState(""),
    [status, setStatus] = useState(entry.status),
    [attempt, setAttempt] = useState<Decision | null>(null);
  const client = useQueryClient();
  const save = useMutation({
    mutationFn: (decision: Decision) =>
      supportRequest((signal) =>
        customFetch(`/api/admin/support/cases/${entry.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(decision),
          signal,
        }),
      ),
    retry: false,
    onSuccess: () => {
      setAttempt(null);
      setNote("");
      onSaved();
    },
  });
  async function review() {
    const rows = await supportRequest((signal) =>
      customFetch<Case[]>("/api/admin/support/cases", { signal }),
    );
    client.setQueryData(["admin-support-cases"], rows);
    if (attempt && supportRecovery(attempt.id, [], save.error) === "rejected") {
      setAttempt(null);
      save.reset();
    }
  }
  const refresh = useMutation({ mutationFn: review, retry: false });
  return (
    <article className="roco-card">
      <h3>
        {entry.subject} · {entry.status.replaceAll("_", " ")}
      </h3>
      <p>
        Case {entry.id}
        {entry.orderId && ` · Order ${entry.orderId}`}
      </p>
      <p>{entry.message}</p>
      {entry.resolution && <p>Previous response: {entry.resolution}</p>}
      <SupportThread caseId={entry.id} />
      <label>
        Status
        <select
          aria-label="Status"
          className="roco-select"
          value={status}
          disabled={save.isPending || !!attempt}
          onChange={(e) => setStatus(e.target.value)}
        >
          {["open", "in_review", "resolved"].map((s) => (
            <option key={s} value={s}>
              {s.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </label>
      <label>
        Response to requester
        <textarea
          aria-label="Response to requester"
          className="roco-input"
          value={note}
          disabled={save.isPending || !!attempt}
          minLength={10}
          maxLength={2000}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      <p>
        Refunds, cancellations and delivery actions must be performed separately
        through their authorized controls.
      </p>
      <button
        className="roco-button primary"
        disabled={save.isPending || note.trim().length < 10}
        onClick={() => {
          const decision = attempt ?? {
            id: crypto.randomUUID(),
            version: entry.version,
            status,
            resolution: note,
          };
          setAttempt(decision);
          save.mutate(decision);
        }}
      >
        {attempt ? "Retry saved decision" : "Update case & notify requester"}
      </button>
      {save.isError && <p role="alert">{save.error.message}</p>}
      <button
        type="button"
        className="roco-button"
        disabled={save.isPending || refresh.isPending}
        onClick={() => refresh.mutate()}
      >
        Review latest case
      </button>
      {refresh.isError && (
        <p role="alert">
          Latest case status could not be loaded. The saved decision is
          retained.
        </p>
      )}
    </article>
  );
}
export function AdminSupport() {
  const q = useQuery({
    queryKey: ["admin-support-cases"],
    queryFn: ({ signal }) =>
      supportRequest(
        (inner) =>
          customFetch<Case[]>("/api/admin/support/cases", { signal: inner }),
        { signal },
      ),
    retry: false,
    refetchInterval: 30000,
  });
  return (
    <section>
      <h2>Support queue</h2>
      {q.isLoading ? (
        <p>Loading support queue…</p>
      ) : q.isError ? (
        <button onClick={() => void q.refetch()}>Retry support queue</button>
      ) : q.data?.length ? (
        q.data.map((c) => (
          <SupportReview
            key={c.id}
            entry={c}
            onSaved={() => void q.refetch()}
          />
        ))
      ) : (
        <p>No support cases.</p>
      )}
    </section>
  );
}
