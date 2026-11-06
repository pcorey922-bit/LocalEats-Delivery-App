import { DriverApplicationReviews } from "./driver-onboarding";
import { OrderTracking, DispatchOperations } from "./delivery-tracking";
import { LedgerReport } from "./ledger-report";
import { OperationalConsole } from "./operational-console";
import { useEffect, useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  useGetMyProfile,
  getListMyOrdersQueryKey,
} from "@workspace/api-client-react";
import { customFetch } from "../../../../lib/api-client-react/src/custom-fetch";
import type { Order } from "@workspace/api-client-react";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    value / 100,
  );
export type Pricing = {
  deliveryFeeCents: number;
  serviceFeeBps: number;
  taxBps: number;
  taxDeliveryAndService: boolean;
  restaurantCommissionBps: number;
  driverShareBps: number;
  allowedPostalCodes: string[];
  testMode: true;
};
export type CommerceConfig = {
  mode: "sandbox" | "stripe_test" | "disabled";
  testMode: true;
  liveChargesEnabled: false;
  pricing: Pricing | null;
  taxNotice: string;
};
export function useCommerce() {
  return useQuery({
    queryKey: ["commerce-config"],
    queryFn: () => customFetch<CommerceConfig>("/api/commerce/config"),
    staleTime: 30000,
  });
}
export async function openExternal(url: string) {
  if (Capacitor.isNativePlatform()) await Browser.open({ url });
  else window.location.assign(url);
}
function ErrorText({ error }: { error: Error | null }) {
  return error ? (
    <p className="roco-alert" role="alert">
      {error.message}
    </p>
  ) : null;
}
export function CommerceBanner() {
  const config = useCommerce();
  return (
    <aside
      className="roco-notice"
      role="status"
      style={{ margin: "12px auto", maxWidth: 1120 }}
    >
      <strong>TEST MODE · Live charges disabled.</strong>{" "}
      {config.data?.mode === "sandbox"
        ? "Local simulator: no money moves."
        : config.data?.mode === "stripe_test"
          ? "Stripe test integration: use test payment details only."
          : "Payments are not configured."}{" "}
      Tax and pricing settings are illustrative.{" "}
      <Link href="/notifications">Notifications</Link> ·{" "}
      <Link href="/earnings">Earnings</Link> ·{" "}
      <Link href="/operations">Order operations</Link> ·{" "}
      <Link href="/account/delete">Delete account</Link>
    </aside>
  );
}
export function CheckoutPanel({
  orderId,
}: {
  orderId: string;
  onDone?: () => void;
}) {
  const [operationId, setOperationId] = useState<string | null>(null);
  const checkout = useMutation({
    mutationFn: () =>
      customFetch<{ mode: string; operationId: string; url: string | null }>(
        `/api/orders/${orderId}/checkout`,
        { method: "POST" },
      ),
    onSuccess: (result) => {
      setOperationId(result.operationId);
    },
  });
  const operations = useQuery({
    queryKey: ["financial-operations", orderId],
    queryFn: () =>
      customFetch<
        Array<{
          id: string;
          state: string;
          result: { url?: string | null } | null;
          errorCode: string | null;
        }>
      >(`/api/orders/${orderId}/financial-operations`),
    enabled: Boolean(operationId),
    refetchInterval: 2000,
  });
  const operation = operations.data?.find((op) => op.id === operationId);
  const url = operation?.state === "succeeded" ? operation.result?.url : null;
  const waiting = Boolean(
    operationId &&
    (!operation ||
      ["queued", "processing", "pending"].includes(operation.state)),
  );
  return (
    <section aria-label="Secure payment">
      <button
        className="roco-button primary"
        disabled={checkout.isPending || waiting}
        onClick={() => checkout.mutate()}
      >
        {waiting ? "Preparing secure checkout…" : "Prepare secure test payment"}
      </button>
      <ErrorText error={checkout.error} />
      <ErrorText error={operations.error} />
      {waiting && (
        <p role="status">
          Your checkout request is saved. You can safely refresh if the
          connection drops.
        </p>
      )}
      {url && (
        <button
          className="roco-button primary"
          onClick={() => void openExternal(url)}
        >
          Open Stripe test checkout
        </button>
      )}
      {operation && ["failed", "reconciliation"].includes(operation.state) && (
        <p className="roco-alert" role="alert">
          Payment setup needs support review. Reference: {operation.id}. No
          payment confirmation has been received.
        </p>
      )}
    </section>
  );
}
export function OrderActions({ order }: { order: Order }) {
  const client = useQueryClient();
  const profile = useGetMyProfile();
  const [expanded, setExpanded] = useState(false);
  const details = useQuery({
    queryKey: ["payment", order.id],
    queryFn: () =>
      customFetch<{ refund: { status: string; amountCents: number } | null }>(
        `/api/orders/${order.id}/payment`,
      ),
    enabled: expanded,
    refetchInterval: 10000,
  });
  const cancel = useMutation({
    mutationFn: () =>
      customFetch(`/api/orders/${order.id}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason: "Cancellation requested in app" }),
      }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: getListMyOrdersQueryKey() });
      void client.invalidateQueries({ queryKey: ["payment", order.id] });
    },
  });
  const mayCancel =
    profile.data?.role === "admin" ||
    ["placed", "restaurant_received", "pending"].includes(order.status);
  return (
    <div style={{ marginTop: 12 }}>
      {order.status === "placed" &&
        !order.paymentCollected &&
        order.paymentStatus === "pending" && (
          <CheckoutPanel orderId={order.id} />
        )}
      {mayCancel && order.status !== "cancelled" && (
        <button
          className="roco-button danger"
          disabled={cancel.isPending}
          onClick={() => {
            if (
              window.confirm(
                "Cancel this order and request a full test refund if paid?",
              )
            )
              cancel.mutate();
          }}
        >
          Cancel / full test refund
        </button>
      )}
      <button className="roco-button" onClick={() => setExpanded(!expanded)}>
        {expanded ? "Hide" : "View"} details
      </button>
      <ErrorText error={cancel.error} />
      {expanded && (
        <section>
          <p>
            Food {money(order.subtotalCents)} · delivery{" "}
            {money(order.deliveryFeeCents)} · service{" "}
            {money(order.serviceFeeCents)} · test tax {money(order.taxCents)} ·
            tip {money(order.tipCents)}
          </p>
          <p>
            {order.deliveryAddress.street1}, {order.deliveryAddress.city}
          </p>
          {["ready_for_pickup", "out_for_delivery"].includes(order.status) && (
            <OrderTracking orderId={order.id} />
          )}
          <ol>
            {order.events.map((event) => (
              <li key={event.id}>
                {new Date(event.createdAt).toLocaleString()} ·{" "}
                {event.toStatus.replaceAll("_", " ")} {event.note}
              </li>
            ))}
          </ol>
          {details.data?.refund && (
            <p>
              Full test refund: {details.data.refund.status} ·{" "}
              {money(details.data.refund.amountCents)}
            </p>
          )}
          <ErrorText error={details.error} />
        </section>
      )}
    </div>
  );
}
export function NotificationsPage() {
  const client = useQueryClient();
  const inbox = useQuery({
    queryKey: ["notifications"],
    queryFn: () =>
      customFetch<
        Array<{
          id: string;
          title: string;
          body: string;
          readAt: string | null;
          createdAt: string;
        }>
      >("/api/notifications"),
    refetchInterval: 10000,
  });
  const mark = useMutation({
    mutationFn: (id: string) =>
      customFetch(`/api/notifications/${id}/read`, { method: "POST" }),
    onSuccess: () =>
      void client.invalidateQueries({ queryKey: ["notifications"] }),
  });
  return (
    <main className="roco-main">
      <Link href="/">← RoCoEats</Link>
      <h1>Notifications</h1>
      <p>Order, delivery, refund, and earnings updates are saved here.</p>
      <PushEnrollment />
      <ErrorText error={inbox.error} />
      <ErrorText error={mark.error} />
      {inbox.isPending ? (
        <p>Loading…</p>
      ) : inbox.data?.length ? (
        inbox.data.map((n) => (
          <article className="roco-card" key={n.id}>
            <h2>{n.title}</h2>
            <p>{n.body}</p>
            <p>{new Date(n.createdAt).toLocaleString()}</p>
            {!n.readAt && (
              <button
                className="roco-button"
                disabled={mark.isPending}
                onClick={() => mark.mutate(n.id)}
              >
                Mark read
              </button>
            )}
          </article>
        ))
      ) : (
        <p>No notifications yet.</p>
      )}
    </main>
  );
}
export function EarningsPage() {
  const client = useQueryClient();
  const payouts = useQuery({
    queryKey: ["my-payouts"],
    queryFn: () => customFetch<Payout[]>("/api/payouts/me"),
    refetchInterval: 15000,
  });
  const account = useQuery({
    queryKey: ["payout-account"],
    refetchInterval: 5000,
    queryFn: () =>
      customFetch<{ account: { ready: boolean } | null }>(
        "/api/payout-account",
      ),
  });
  const onboard = useMutation({
    mutationFn: () =>
      customFetch<{ url: string | null }>("/api/payout-account/onboard", {
        method: "POST",
      }),
    onSuccess: async (result) => {
      if (result.url) await openExternal(result.url);
      void client.invalidateQueries({ queryKey: ["payout-account"] });
    },
  });
  return (
    <main className="roco-main">
      <Link href="/">← RoCoEats</Link>
      <p>
        <a href="rocoeats://earnings">Return to mobile app</a>
      </p>
      <h1>Test earnings</h1>
      <CommerceBanner />
      <p>
        Available to restaurant owners and approved drivers. Transfers move test
        funds to a connected balance; bank payout timing is controlled by the
        provider.
      </p>
      <p>
        Payout account:{" "}
        {account.data?.account?.ready ? "ready" : "onboarding required"}
      </p>
      <button
        className="roco-button primary"
        disabled={onboard.isPending}
        onClick={() => onboard.mutate()}
      >
        Set up test payout account
      </button>
      <button className="roco-button" onClick={() => void account.refetch()}>
        Refresh account status
      </button>
      <ErrorText error={onboard.error} />
      <ErrorText error={account.error} />
      <ErrorText error={payouts.error} />
      {payouts.data?.map((p) => (
        <article className="roco-card" key={p.id}>
          <strong>{money(p.amountCents)}</strong>
          <p>
            {p.kind} ·{" "}
            {p.providerReversalId
              ? "reversed"
              : p.status === "paid"
                ? "transferred to test balance"
                : p.status}
          </p>
          <p>Order {p.orderId}</p>
        </article>
      ))}
    </main>
  );
}
type Payout = {
  id: string;
  orderId: string;
  kind: string;
  amountCents: number;
  status: string;
  providerReversalId: string | null;
};
export function OperationsCommerce() {
  const profile = useGetMyProfile();
  const client = useQueryClient();
  const enabled = profile.data?.role === "admin";
  const config = useCommerce();
  const orders = useQuery({
    queryKey: getListMyOrdersQueryKey(),
    queryFn: () => customFetch<Order[]>("/api/orders/me"),
    enabled,
    refetchInterval: 10000,
  });
  const payouts = useQuery({
    queryKey: ["admin-payouts"],
    queryFn: () => customFetch<Payout[]>("/api/admin/payouts"),
    enabled,
    refetchInterval: 15000,
  });
  const refunds = useQuery({
    queryKey: ["admin-refunds"],
    queryFn: () =>
      customFetch<
        Array<{ id: string; orderId: string; status: string; reason: string }>
      >("/api/admin/refunds"),
    enabled,
    refetchInterval: 15000,
  });
  const drivers = useQuery({
    queryKey: ["admin-driver-approvals"],
    queryFn: () =>
      customFetch<
        Array<{ id: string; displayName: string; driverApproved: boolean }>
      >("/api/admin/drivers"),
    enabled,
  });
  const [error, setError] = useState("");
  const change = useMutation({
    mutationFn: ({
      path,
      method = "POST",
      data,
    }: {
      path: string;
      method?: string;
      data?: unknown;
    }) =>
      customFetch(path, {
        method,
        ...(data ? { body: JSON.stringify(data) } : {}),
      }),
    onSuccess: () => {
      setError("");
      void client.invalidateQueries();
    },
    onError: (e) => setError(e.message),
  });
  if (!enabled)
    return (
      <main className="roco-main">
        <Link href="/">← Home</Link>
        <h1>Administrator access required</h1>
      </main>
    );
  return (
    <main className="roco-main">
      <DriverApplicationReviews />
      <Link href="/admin">← Operations overview</Link>
      <h1>Test order operations</h1>
      <CommerceBanner />
      {error && (
        <p role="alert" className="roco-alert">
          {error}
        </p>
      )}
      <ErrorText error={orders.error} />
      <ErrorText error={payouts.error} />
      <ErrorText error={refunds.error} />
      <ErrorText error={drivers.error} />
      <FinancialOperations />
      <OperationalConsole />
      <LedgerReport />
      <DispatchOperations />
      <h2>Driver approval</h2>
      {drivers.data?.map((d) => (
        <article className="roco-card" key={d.id}>
          <strong>{d.displayName}</strong>
          <p>{d.driverApproved ? "approved" : "pending approval"}</p>
          <button
            className="roco-button"
            disabled={change.isPending}
            onClick={() =>
              change.mutate({
                path: `/api/admin/drivers/${d.id}/approval`,
                method: "PATCH",
                data: { approved: !d.driverApproved },
              })
            }
          >
            {d.driverApproved ? "Revoke" : "Approve"} test dispatch access
          </button>
        </article>
      ))}
      <h2>Orders and full refunds</h2>
      {orders.data?.map((o) => (
        <article className="roco-card" key={o.id}>
          <h3>
            {o.restaurantName} · {o.status}
          </h3>
          <p>
            {o.id} · {money(o.totalCents)} · test payment {o.paymentStatus}
          </p>
          <OrderActions order={o} />
        </article>
      ))}
      <h2>Refund requests</h2>
      {refunds.data?.map((r) => (
        <article className="roco-card" key={r.id}>
          <p>
            {r.orderId} · {r.status} · {r.reason}
          </p>
          {r.status !== "succeeded" && (
            <button
              className="roco-button"
              disabled={change.isPending}
              onClick={() =>
                change.mutate({
                  path: `/api/orders/${r.orderId}/cancel`,
                  data: { reason: r.reason },
                })
              }
            >
              Process / reconcile full test refund
            </button>
          )}
        </article>
      ))}
      <h2>Settlement queue</h2>
      {payouts.data?.map((p) => (
        <article className="roco-card" key={p.id}>
          <p>
            {p.kind} · {money(p.amountCents)} ·{" "}
            {p.providerReversalId
              ? "reversed"
              : p.status === "paid"
                ? "transferred"
                : p.status}
          </p>
          {p.status === "pending" && (
            <button
              className="roco-button"
              disabled={change.isPending}
              onClick={() =>
                change.mutate({ path: `/api/admin/payouts/${p.id}/transfer` })
              }
            >
              Transfer test earnings
            </button>
          )}
        </article>
      ))}
      <PricingSettings current={config.data?.pricing ?? null} />
    </main>
  );
}
import { registerPush } from "../lib/mobile";
function PushEnrollment() {
  const enroll = useMutation({ mutationFn: registerPush });
  return (
    <div>
      <button
        className="roco-button"
        disabled={enroll.isPending}
        onClick={() => enroll.mutate()}
      >
        Enable mobile push notifications
      </button>
      <p>
        {enroll.isSuccess ? "Device registered for test push updates." : ""}
      </p>
      <ErrorText error={enroll.error} />
    </div>
  );
}
export function RestaurantAvailability() {
  const client = useQueryClient();
  type Hour = {
    weekday: number;
    isClosed: boolean;
    openTime: string;
    closeTime: string;
  };
  const settings = useQuery({
    queryKey: ["restaurant-availability"],
    queryFn: () =>
      customFetch<{ acceptingOrders: boolean; hours: Hour[] }>(
        "/api/restaurants/me/availability/settings",
      ),
  });
  const save = useMutation({
    mutationFn: (value: { acceptingOrders: boolean; hours: Hour[] }) =>
      customFetch("/api/restaurants/me/availability/settings", {
        method: "PUT",
        body: JSON.stringify(value),
      }),
    onSuccess: () =>
      void client.invalidateQueries({ queryKey: ["restaurant-availability"] }),
  });
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    save.mutate({
      acceptingOrders: form.get("accepting") === "on",
      hours: Array.from({ length: 7 }, (_, weekday) => ({
        weekday,
        isClosed: form.get(`closed${weekday}`) === "on",
        openTime: String(form.get(`open${weekday}`)),
        closeTime: String(form.get(`close${weekday}`)),
      })),
    });
  };
  return (
    <section className="roco-card">
      <h2>Ordering and opening hours</h2>
      <p>
        Times use America/New_York. Use 24:00 to close at midnight; overnight
        shifts must be split across days. Unconfigured and paused restaurants
        cannot receive new checkouts.
      </p>
      <ErrorText error={settings.error} />
      {settings.data && (
        <form onSubmit={submit}>
          <label>
            <input
              type="checkbox"
              name="accepting"
              defaultChecked={settings.data.acceptingOrders}
            />{" "}
            Accept test orders during opening hours
          </label>
          {[
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ].map((name, weekday) => {
            const hour = settings.data!.hours.find(
              (h) => h.weekday === weekday,
            );
            return (
              <div className="roco-row" key={name}>
                <span>{name}</span>
                <label>
                  <input
                    type="checkbox"
                    name={`closed${weekday}`}
                    defaultChecked={hour?.isClosed ?? true}
                  />{" "}
                  Closed
                </label>
                <input
                  aria-label={`${name} opens`}
                  className="roco-input"
                  name={`open${weekday}`}
                  placeholder="09:00"
                  defaultValue={hour?.openTime?.slice(0, 5) ?? "09:00"}
                  pattern="[0-2][0-9]:[0-5][0-9]"
                  required
                />
                <input
                  aria-label={`${name} closes`}
                  className="roco-input"
                  name={`close${weekday}`}
                  placeholder="21:00"
                  defaultValue={hour?.closeTime?.slice(0, 5) ?? "21:00"}
                  pattern="[0-2][0-9]:[0-5][0-9]"
                  required
                />
              </div>
            );
          })}
          <button className="roco-button primary" disabled={save.isPending}>
            Save opening hours
          </button>
          {save.isSuccess && <p>Opening hours saved.</p>}
        </form>
      )}
      <ErrorText error={save.error} />
    </section>
  );
}
export function DeletionRequest() {
  const request = useMutation({
    mutationFn: () =>
      customFetch<{ message: string }>("/api/account/deletion-request", {
        method: "POST",
      }),
  });
  return (
    <section className="roco-card">
      <h2>Account deletion</h2>
      <p>
        Request account removal. Active orders and financial record retention
        must be resolved by operations.
      </p>
      <button
        className="roco-button danger"
        disabled={request.isPending || request.isSuccess}
        onClick={() => {
          if (window.confirm("Request deletion of your RoCoEats account?"))
            request.mutate();
        }}
      >
        Request account deletion
      </button>
      <ErrorText error={request.error} />
      {request.isSuccess && <p>{request.data.message}</p>}
    </section>
  );
}

function FinancialOperations() {
  const client = useQueryClient();
  const reconcile = useMutation({
    mutationFn: (id: string) =>
      customFetch(
        `/api/admin/financial-operations/${encodeURIComponent(id)}/reconcile`,
        { method: "POST" },
      ),
    onSuccess: () => {
      void client.invalidateQueries({
        queryKey: ["admin-financial-operations"],
      });
      void client.invalidateQueries({ queryKey: ["admin-ledger"] });
    },
  });
  const query = useQuery({
    queryKey: ["admin-financial-operations"],
    queryFn: () =>
      customFetch<
        Array<{
          id: string;
          orderId: string;
          kind: string;
          state: string;
          attempts: number;
          errorCode: string | null;
        }>
      >("/api/admin/financial-operations"),
    refetchInterval: 5000,
  });
  return (
    <section>
      <h2>Financial recovery queue</h2>
      <p>
        Provider outcomes are confirmed separately from requests. Reconciliation
        items require review before another monetary operation is attempted.
      </p>
      <ErrorText error={query.error} />
      <ErrorText error={reconcile.error} />
      {reconcile.isSuccess && (
        <p role="status">
          Provider reconciliation completed. Review the updated operation state.
        </p>
      )}
      {query.data
        ?.filter((op) => !["succeeded", "cancelled"].includes(op.state))
        .map((op) => (
          <article key={op.id} className="roco-card">
            <h3>
              {op.kind} · {op.state}
            </h3>
            <p>{op.id}</p>
            <p>
              Attempts: {op.attempts} ·{" "}
              {op.errorCode ?? "Awaiting provider confirmation"}
            </p>
            {["reconciliation", "failed"].includes(op.state) && (
              <button
                className="roco-button"
                disabled={reconcile.isPending}
                onClick={() => reconcile.mutate(op.id)}
              >
                Check saved request against provider records
              </button>
            )}
          </article>
        ))}
    </section>
  );
}

function PricingSettings({ current }: { current: Pricing | null }) {
  const client = useQueryClient();
  const save = useMutation({
    mutationFn: (policy: Pricing) =>
      customFetch("/api/admin/pricing", {
        method: "PUT",
        body: JSON.stringify(policy),
      }),
    onSuccess: () =>
      void client.invalidateQueries({ queryKey: ["commerce-config"] }),
  });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const rate = (key: string) => Math.round(Number(form.get(key)) * 100);
    save.mutate({
      deliveryFeeCents: rate("delivery"),
      serviceFeeBps: rate("service"),
      taxBps: rate("tax"),
      restaurantCommissionBps: rate("commission"),
      driverShareBps: rate("driver"),
      taxDeliveryAndService: form.get("taxBase") === "all",
      allowedPostalCodes: String(form.get("zips"))
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
      testMode: true,
    });
  };
  return (
    <section className="roco-card">
      <h2>Pricing and service policy</h2>
      <p>
        No orders can be quoted until these settings are saved. Tax entries must
        come from your approved tax configuration; test mode does not establish
        the correct tax rate.
      </p>
      <form
        onSubmit={submit}
        key={JSON.stringify(current)}
        className="roco-form-grid"
      >
        {(
          [
            ["delivery", "Delivery fee ($)", current?.deliveryFeeCents, 100],
            ["service", "Service fee (%)", current?.serviceFeeBps, 30],
            ["tax", "Configured tax rate (%)", current?.taxBps, 30],
            [
              "commission",
              "Restaurant commission (%)",
              current?.restaurantCommissionBps,
              30,
            ],
            [
              "driver",
              "Driver share of delivery fee (%)",
              current?.driverShareBps,
              100,
            ],
          ] as const
        ).map(([name, label, value, max]) => (
          <label className="roco-field" key={name}>
            {label}
            <input
              className="roco-input"
              type="number"
              name={name}
              min="0"
              max={max}
              step="0.01"
              required
              defaultValue={value === undefined ? "" : value / 100}
            />
          </label>
        ))}
        <label className="roco-field">
          Taxable charges
          <select
            className="roco-select"
            name="taxBase"
            required
            defaultValue={
              current ? (current.taxDeliveryAndService ? "all" : "food") : ""
            }
          >
            <option value="">Choose the approved tax base</option>
            <option value="food">Food subtotal</option>
            <option value="all">Food, delivery and service fees</option>
          </select>
        </label>
        <label className="roco-field full">
          Delivery ZIP codes, separated by commas
          <input
            className="roco-input"
            name="zips"
            required
            defaultValue={current?.allowedPostalCodes.join(", ") ?? ""}
          />
        </label>
        <button className="roco-button primary" disabled={save.isPending}>
          Save pricing policy for provider testing
        </button>
      </form>
      <ErrorText error={save.error} />
      {save.isSuccess && (
        <p role="status">
          Policy saved. Existing orders retain their original pricing.
        </p>
      )}
    </section>
  );
}
