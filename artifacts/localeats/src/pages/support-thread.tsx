import { useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { customFetch } from "../../../../lib/api-client-react/src/custom-fetch";
type Message = {
  id: string;
  authorRole: string;
  kind: string;
  body: string;
  caseVersion: number;
  statusAfter: string;
  createdAt: string;
};
type Page = {
  case: { id: string; status: string; version: number };
  messages: Message[];
  nextBeforeVersion: number | null;
};
type Attempt = { id: string; version: number; message: string };
export function SupportThread({ caseId }: { caseId: string }) {
  const [open, setOpen] = useState(false),
    [text, setText] = useState(""),
    [attempt, setAttempt] = useState<Attempt | null>(null);
  const client = useQueryClient();
  const q = useInfiniteQuery({
    queryKey: ["support-thread", caseId],
    initialPageParam: null as number | null,
    queryFn: ({ pageParam }) =>
      customFetch<Page>(
        `/api/support/cases/${caseId}/messages${pageParam === null ? "" : `?beforeVersion=${pageParam}`}`,
      ),
    getNextPageParam: (last) => last.nextBeforeVersion ?? undefined,
    enabled: open,
    refetchInterval: open ? 15000 : false,
  });
  const send = useMutation({
    mutationFn: (value: Attempt) =>
      customFetch(`/api/support/cases/${caseId}/messages`, {
        method: "POST",
        body: JSON.stringify(value),
      }),
    onSuccess: () => {
      setText("");
      setAttempt(null);
      void client.invalidateQueries({ queryKey: ["support-thread", caseId] });
      void client.invalidateQueries({ queryKey: ["my-support-cases"] });
      void client.invalidateQueries({ queryKey: ["admin-support-cases"] });
    },
  });
  const refresh = async () => {
    const result = await q.refetch();
    if (result.isError || !result.data) return;
    if (
      attempt &&
      result.data?.pages.some((p) =>
        p.messages.some((m) => m.id === attempt.id),
      )
    )
      setText("");
    setAttempt(null);
    send.reset();
  };
  return (
    <section>
      <button className="roco-button" onClick={() => setOpen(!open)}>
        {open ? "Hide conversation" : "Conversation & reply"}
      </button>
      {open && (
        <section className="roco-card">
          <h4>Support conversation</h4>
          {q.error && <p role="alert">{q.error.message}</p>}
          {q.hasNextPage && (
            <button
              className="roco-button"
              disabled={q.isFetchingNextPage}
              onClick={() => void q.fetchNextPage()}
            >
              Load older messages
            </button>
          )}
          {[...(q.data?.pages ?? [])]
            .reverse()
            .flatMap((p) => p.messages)
            .map((m) => (
              <article key={m.id}>
                <strong>
                  {m.authorRole === "admin" ? "Operations" : "Requester"} ·{" "}
                  {m.kind === "decision" ? m.statusAfter : "reply"}
                </strong>
                <p style={{ whiteSpace: "pre-wrap" }}>{m.body}</p>
                <p className="roco-meta">
                  {new Date(m.createdAt).toLocaleString()}
                </p>
              </article>
            ))}
          <p>
            Replies after resolution reopen the case. Messages do not
            automatically cancel, refund or complete a delivery. Do not include
            credentials, card or banking details.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!q.data) return;
              const payload = attempt ?? {
                id: crypto.randomUUID(),
                version: q.data.pages[0].case.version,
                message: text,
              };
              setAttempt(payload);
              send.mutate(payload);
            }}
          >
            <label className="roco-field">
              Reply
              <textarea
                className="roco-input"
                value={text}
                required
                minLength={3}
                maxLength={3000}
                disabled={send.isPending || !!attempt}
                onChange={(e) => setText(e.target.value)}
              />
            </label>
            <button
              className="roco-button"
              disabled={send.isPending || !q.data || text.trim().length < 3}
            >
              {attempt ? "Retry saved reply" : "Send reply"}
            </button>
          </form>
          {send.error && (
            <p role="alert">
              {send.error.message} Your reply ID is retained for a safe retry.
            </p>
          )}
          {send.isSuccess && <p role="status">Reply saved.</p>}
          <button
            className="roco-button"
            disabled={send.isPending}
            onClick={() => void refresh()}
          >
            Review latest conversation
          </button>
        </section>
      )}
    </section>
  );
}
