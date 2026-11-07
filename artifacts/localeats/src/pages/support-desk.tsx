import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "../../../../lib/api-client-react/src/custom-fetch";
import { SupportThread } from "./support-thread";
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
export function SupportDesk({ orderId }: { orderId?: string }) {
  const [open, setOpen] = useState(false),
    [id, setId] = useState(() => crypto.randomUUID()),
    [subject, setSubject] = useState(""),
    [message, setMessage] = useState("");
  const client = useQueryClient();
  const q = useQuery({
    queryKey: ["my-support-cases"],
    queryFn: () => customFetch<Case[]>("/api/support/cases"),
    enabled: open,
    refetchInterval: open ? 30000 : false,
  });
  const send = useMutation({
    mutationFn: () =>
      customFetch("/api/support/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          orderId,
          category: orderId ? "delivery" : "account",
          subject,
          message,
        }),
      }),
    onSuccess: () => {
      setId(crypto.randomUUID());
      setSubject("");
      setMessage("");
      void client.invalidateQueries({ queryKey: ["my-support-cases"] });
    },
  });
  function submit(e: FormEvent) {
    e.preventDefault();
    send.mutate();
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
                minLength={10}
                maxLength={3000}
                required
                onChange={(e) => setMessage(e.target.value)}
              />
            </label>
            <button className="roco-button primary" disabled={send.isPending}>
              Send support request
            </button>
          </form>
          {send.isSuccess && (
            <p role="status">
              Request received. Operations will review it here.
            </p>
          )}
          {send.isError && <p role="alert">{send.error.message}</p>}
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
                  <SupportThread caseId={c.id}/>
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
    [status, setStatus] = useState(entry.status);
  const save = useMutation({
    mutationFn: () =>
      customFetch(`/api/admin/support/cases/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version: entry.version,
          status,
          resolution: note,
        }),
      }),
    onSuccess: onSaved,
  });
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
      <SupportThread caseId={entry.id}/>
      <label>
        Status
        <select
          className="roco-select"
          value={status}
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
          className="roco-input"
          value={note}
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
        onClick={() => save.mutate()}
      >
        Update case & notify requester
      </button>
      {save.isError && <p role="alert">{save.error.message}</p>}
    </article>
  );
}
export function AdminSupport() {
  const q = useQuery({
    queryKey: ["admin-support-cases"],
    queryFn: () => customFetch<Case[]>("/api/admin/support/cases"),
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
            key={`${c.id}:${c.version}`}
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
