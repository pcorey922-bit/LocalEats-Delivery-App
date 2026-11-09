import { type FormEvent, useState } from "react";
import { useAuth } from "@clerk/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import type { Order } from "@workspace/api-client-react";
import { customFetch } from "../../../../lib/api-client-react/src/custom-fetch";
import {
  readGuestToken,
  privateGuestLink,
  saveGuestToken,
  useGuestToken,
} from "../lib/guest-session";
import { OrderActions } from "./commerce-pages";
import { OrderTracking } from "./delivery-tracking";
import { CustomerHandoff } from "./delivery-handoff";
export function GuestCheckoutAccess({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSignedIn } = useAuth();
  const token = useGuestToken();
  const client = useQueryClient();
  const start = useMutation({
    mutationFn: async (input: {
      name: string;
      email: string;
      phone: string;
    }) => {
      const result = await customFetch<{ token: string }>(
        "/api/guest/sessions",
        { method: "POST", body: JSON.stringify(input) },
      );
      saveGuestToken(result.token);
      client.clear();
    },
  });
  if (isSignedIn || token) return <>{children}</>;
  return (
    <main className="roco-main">
      <section className="roco-card">
        <h1>Continue as Guest</h1>
        <p>
          No account or password required. We need your contact details to
          fulfill your order. Cards are entered only in secure Stripe TEST
          checkout.
        </p>
        <form
          className="roco-form-grid"
          onSubmit={(e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            start.mutate({
              name: String(f.get("name")),
              email: String(f.get("email")),
              phone: String(f.get("phone")),
            });
          }}
        >
          <label className="roco-field">
            Your name
            <input
              className="roco-input"
              name="name"
              autoComplete="name"
              required
              minLength={2}
              maxLength={120}
            />
          </label>
          <label className="roco-field">
            Receipt email
            <input
              className="roco-input"
              type="email"
              name="email"
              autoComplete="email"
              required
              maxLength={254}
            />
          </label>
          <label className="roco-field">
            Delivery phone
            <input
              className="roco-input"
              type="tel"
              name="phone"
              autoComplete="tel"
              required
              minLength={7}
              maxLength={30}
            />
          </label>
          <button className="roco-button primary" disabled={start.isPending}>
            Continue as Guest
          </button>
        </form>
        {start.isError && <p role="alert">{start.error.message}</p>}
        <p>
          Private staging requires an invited tester to create guest access.
          Public ordering remains disabled.
        </p>
        <Link href="/">Keep browsing</Link> ·{" "}
        <Link href="/sign-in">Sign in instead</Link>
      </section>
    </main>
  );
}
export function GuestOrderPage() {
  const token = useGuestToken(),
    client = useQueryClient();
  const { isSignedIn } = useAuth();
  const [message, setMessage] = useState("");
  const access = useQuery({
    queryKey: ["guest-current-order", token],
    queryFn: () =>
      customFetch<{ orderId: string | null; expiresAt: string }>(
        "/api/guest/session",
      ),
    enabled: !!token && !isSignedIn,
    retry: false,
  });
  const order = useQuery({
    queryKey: ["guest-order", access.data?.orderId],
    queryFn: () => customFetch<Order>(`/api/orders/${access.data!.orderId}`),
    enabled: !!access.data?.orderId,
    refetchInterval: 10000,
    retry: false,
  });
  const claim = useMutation({
    mutationFn: () =>
      customFetch("/api/guest/claim", {
        method: "POST",
        headers: { "X-RoCoEats-Guest-Token": readGuestToken() || "" },
      }),
    onSuccess: () => {
      saveGuestToken(null);
      client.clear();
      setMessage("Order linked to your account. Open your order history.");
    },
  });
  const revoke = useMutation({
    mutationFn: () => customFetch("/api/guest/session", { method: "DELETE" }),
    onSuccess: () => {
      saveGuestToken(null);
      client.clear();
    },
  });
  return (
    <main className="roco-main">
      <Link href="/">RoCoEats · Find food</Link>
      <h1>Your guest order</h1>
      <p>
        <a href="rocoeats://orders">Return to mobile app</a>
      </p>
      <p>
        Keep this private link safe. Anyone with it can access this order and
        request permitted changes. Guest access expires after seven days. It is
        not an account or a public order number.
      </p>
      {token && !isSignedIn && (
        <>
          <button
            className="roco-button"
            onClick={async () => {
              try {
                const url = privateGuestLink(token);
                await navigator.clipboard.writeText(url);
                setMessage(
                  "Private tracking link copied. Do not share it publicly.",
                );
              } catch {
                setMessage(
                  "Private link could not be copied. Check the app's HTTPS staging configuration and clipboard permission. Keep this device's saved access available.",
                );
              }
            }}
          >
            Copy private tracking link
          </button>
          <button
            className="roco-button"
            disabled={revoke.isPending}
            onClick={() => {
              if (
                window.confirm(
                  "Revoke this guest link? Save your order reference for support first. This action cannot be undone here.",
                )
              )
                revoke.mutate();
            }}
          >
            Revoke guest access
          </button>
        </>
      )}
      {!token && (
        <p>
          No guest access is saved on this device. Open your private tracking
          link or contact dispatch with your order reference for verified
          recovery. <Link href="/cart">Continue as Guest</Link>
        </p>
      )}
      {isSignedIn && token && (
        <>
          <p>
            Linking requires this private guest access and your signed-in
            customer account. Matching email alone does not grant access.
          </p>
          <button
            className="roco-button"
            disabled={claim.isPending}
            onClick={() => claim.mutate()}
          >
            Link guest order to my customer account
          </button>
        </>
      )}
      {message && <p role="status">{message}</p>}
      {[access.error, order.error, claim.error, revoke.error]
        .filter(Boolean)
        .map((e, i) => (
          <p role="alert" key={i}>
            {e!.message}
          </p>
        ))}
      {access.isLoading && <p role="status">Retrieving your order…</p>}
      {access.data && !access.data.orderId && (
        <p>
          No order submitted yet. <Link href="/cart">Return to checkout</Link>
        </p>
      )}
      {order.data && (
        <article className="roco-card">
          <h2>{order.data.restaurantName}</h2>
          <p>Order reference: {order.data.id}</p>
          <p>
            Payment: {order.data.paymentStatus}. Restaurant acceptance is
            separate from payment.
          </p>
          <p>Total ${(order.data.totalCents / 100).toFixed(2)}</p>
          <ul>
            {order.data.items.map((i) => (
              <li key={i.id}>
                {i.quantity} × {i.itemName}
              </li>
            ))}
          </ul>
          <OrderTracking orderId={order.data.id} />
          <OrderActions order={order.data} />
          {["out_for_delivery", "delivered"].includes(order.data.status) && (
            <CustomerHandoff
              orderId={order.data.id}
              delivered={order.data.status === "delivered"}
            />
          )}
        </article>
      )}
      <p>
        <Link href="/sign-up">Optional: create an account</Link> ·{" "}
        <Link href="/orders">Registered order history</Link>
      </p>
    </main>
  );
}
