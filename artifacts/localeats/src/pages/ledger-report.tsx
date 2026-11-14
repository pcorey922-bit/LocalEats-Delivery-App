import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { customFetch } from "../../../../lib/api-client-react/src/custom-fetch";
type Report = {
  balanced: boolean;
  currency: string;
  notice: string;
  missingPaymentBaselines: string;
  nextCursor: string | null;
  balances: Array<{
    account: string;
    debitsCents: string;
    creditsCents: string;
    balanceCents: string;
  }>;
  journals: Array<{
    id: string;
    orderId: string;
    kind: string;
    createdAt: string;
    lines: Array<{
      account: string;
      partyProfileId: string | null;
      amountCents: number;
    }>;
  }>;
};
// Aggregate cents arrive as decimal strings and can exceed Number's precision.
function amount(cents: string | number) {
  const n = BigInt(cents),
    absolute = n < 0n ? -n : n;
  return `${n < 0n ? "-" : ""}$${(absolute / 100n).toLocaleString("en-US")}.${String(absolute % 100n).padStart(2, "0")}`;
}
export function LedgerReport() {
  const [filter, setFilter] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<string | null>>([]);
  const query = useQuery({
    queryKey: ["admin-ledger", filter, cursor],
    queryFn: () =>
      customFetch<Report>(
        `/api/admin/ledger?limit=20${filter ? `&orderId=${encodeURIComponent(filter)}` : ""}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
      ),
  });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilter(String(new FormData(event.currentTarget).get("orderId")).trim());
    setCursor(null);
    setHistory([]);
  };
  return (
    <section className="roco-card">
      <h2>Operational ledger</h2>
      <p>
        Immutable journals for test payments, earnings, transfers, refunds and
        recoveries. Positive balances are debits; negative balances are credits.
      </p>
      <form className="roco-row" onSubmit={submit}>
        <label className="roco-field">
          Filter by order ID
          <input
            className="roco-input"
            name="orderId"
            placeholder="All orders"
          />
        </label>
        <button className="roco-button">Apply filter</button>
        <button
          type="button"
          className="roco-button"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          Refresh
        </button>
      </form>
      {query.isPending && <p role="status">Loading journals…</p>}
      {query.error && <p role="alert">{query.error.message}</p>}
      {query.data && (
        <>
          <p role="status">
            {query.data.balanced
              ? "Trial balance is balanced."
              : "Ledger imbalance requires investigation."}{" "}
            Missing payment baselines: {query.data.missingPaymentBaselines}.
          </p>
          <p>{query.data.notice}</p>
          <div style={{ overflowX: "auto" }}>
            <table>
              <caption>
                Account totals for the selected orders, all dates
              </caption>
              <thead>
                <tr>
                  <th scope="col">Account</th>
                  <th scope="col">Debits</th>
                  <th scope="col">Credits</th>
                  <th scope="col">Balance</th>
                </tr>
              </thead>
              <tbody>
                {query.data.balances.map((row) => (
                  <tr key={row.account}>
                    <th scope="row">{row.account.replaceAll("_", " ")}</th>
                    <td>{amount(row.debitsCents)}</td>
                    <td>{amount(row.creditsCents)}</td>
                    <td>{amount(row.balanceCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!query.data.journals.length && <p>No journals match this filter.</p>}
          {query.data.journals.map((journal) => (
            <details key={journal.id}>
              <summary>
                {journal.kind} · {new Date(journal.createdAt).toLocaleString()}{" "}
                · {journal.orderId}
              </summary>
              <p>Journal: {journal.id}</p>
              <ul>
                {journal.lines.map((line, index) => (
                  <li key={index}>
                    {line.account.replaceAll("_", " ")}
                    {line.partyProfileId
                      ? ` · recipient ${line.partyProfileId}`
                      : ""}
                    : {amount(line.amountCents)}
                  </li>
                ))}
              </ul>
            </details>
          ))}
          <nav aria-label="Journal pages" className="roco-row">
            <button
              className="roco-button"
              disabled={!history.length || query.isFetching}
              onClick={() => {
                setCursor(history.at(-1) ?? null);
                setHistory(history.slice(0, -1));
              }}
            >
              Previous journals
            </button>
            <button
              className="roco-button"
              disabled={!query.data.nextCursor || query.isFetching}
              onClick={() => {
                setHistory([...history, cursor]);
                setCursor(query.data!.nextCursor);
              }}
            >
              Older journals
            </button>
          </nav>
        </>
      )}
    </section>
  );
}
