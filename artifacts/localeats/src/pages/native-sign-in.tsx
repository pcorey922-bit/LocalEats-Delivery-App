import { nativeAccountReturn, type JoinRole } from "../lib/account-entry";
import { useEffect, useRef, useState } from "react";
import { useAuth, useSignIn } from "@clerk/react";
import { Browser } from "@capacitor/browser";
import { Link, useLocation } from "wouter";
import { customFetch } from "../../../../lib/api-client-react/src/custom-fetch";
type Pending = { id: string; verifier: string; expiresAt: string; role?: JoinRole; checkout?: boolean };
const storageKey = "rocoeats-native-auth:v1";
function previous(): Pending | null {
  try {
    const v = JSON.parse(localStorage.getItem(storageKey) || "null");
    return v &&
      /^[a-z0-9-]{36}$/.test(v.id) &&
      /^[A-Za-z0-9_-]{43}$/.test(v.verifier) &&
      Date.parse(v.expiresAt) > Date.now()
      ? v
      : null;
  } catch {
    return null;
  }
}
const encoded = (v: Uint8Array) =>
  btoa(String.fromCharCode(...v))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
export function NativeSignIn({ role, checkout = false }: { role?: JoinRole; checkout?: boolean } = {}) {
  const [pending, setPending] = useState<Pending | null>(previous),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const { isLoaded, isSignedIn } = useAuth(),
    { signIn } = useSignIn(),
    latest = useRef(signIn);
  latest.current = signIn;
  const [, navigate] = useLocation();
  useEffect(() => {
    if (!pending || !isLoaded || isSignedIn) return;
    let cancelled = false;
    const controller = new AbortController();
    void (async () => {
      try {
        while (!cancelled) {
          if (Date.parse(pending.expiresAt) <= Date.now())
            throw Error("Sign-in expired. Start again.");
          const response = await customFetch<{
            pending?: boolean;
            ticket?: string;
          }>("/api/mobile/auth/redeem", {
            method: "POST",
            signal: controller.signal,
            body: JSON.stringify({
              id: pending.id,
              verifier: pending.verifier,
            }),
          });
          if (cancelled) return;
          if (response.ticket) {
            const result = await latest.current.ticket({
              ticket: response.ticket,
            });
            if (result.error)
              throw Error("Sign-in could not finish. Start again.");
            const finalized = await latest.current.finalize();
            if (finalized.error)
              throw Error("Sign-in could not activate. Start again.");
            localStorage.removeItem(storageKey);
            setPending(null);
            await Browser.close().catch(() => {});
            navigate(nativeAccountReturn(pending.role, pending.checkout === true));
            return;
          }
          if (!response.pending)
            throw Error("Unexpected sign-in response. Start again.");
          await new Promise((r) => setTimeout(r, 2000));
        }
      } catch (e) {
        if (!cancelled) {
          localStorage.removeItem(storageKey);
          setPending(null);
          setError(
            e instanceof Error
              ? e.message
              : "Sign-in interrupted. Start again.",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [pending, isLoaded, isSignedIn, navigate]);
  async function start() {
    setBusy(true);
    setError("");
    try {
      const verifier = encoded(crypto.getRandomValues(new Uint8Array(32))),
        challenge = encoded(
          new Uint8Array(
            await crypto.subtle.digest(
              "SHA-256",
              new TextEncoder().encode(verifier),
            ),
          ),
        );
      const response = await customFetch<{
        id: string;
        expiresAt: string;
        authorizationUrl: string;
      }>("/api/mobile/auth/start", {
        method: "POST",
        body: JSON.stringify({ challenge }),
      });
      const url = new URL(response.authorizationUrl);
      if (
        url.origin !== import.meta.env.VITE_API_ORIGIN ||
        url.pathname !== "/mobile/authorize" ||
        url.search ||
        url.username ||
        url.password
      )
        throw Error("Unsafe sign-in destination rejected");
      const saved = {
        id: response.id,
        expiresAt: response.expiresAt,
        verifier,
        role,
        checkout,
      };
      localStorage.setItem(storageKey, JSON.stringify(saved));
      setPending(saved);
      await Browser.open({ url: url.toString() });
    } catch {
      setError(
        "Could not start secure sign-in. Check your connection and that the latest mobile backend is deployed.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="roco-main">
      <section className="roco-card">
        <Link href="/">RoCoEats · Home</Link>
        <h1>Sign in securely</h1>
        <p>
          Google and account creation open in your system browser. Your password
          and Google credentials are never entered into the app's embedded
          browser. Server-side approval remains required for administrator and
          driver access.
        </p>
        {isSignedIn ? (
          <Link href={nativeAccountReturn(role, checkout)}>Open account</Link>
        ) : (
          <button
            className="roco-button primary"
            disabled={busy || !!pending || !isLoaded}
            onClick={() => void start()}
          >
            Sign in or create account in browser
          </button>
        )}
        {pending && (
          <>
            <p role="status">
              Finish signing in in your browser, approve the app request, then
              return to RoCoEats. This request expires in five minutes.
            </p>
            <button
              className="roco-button"
              onClick={() => {
                localStorage.removeItem(storageKey);
                setPending(null);
              }}
            >
              Cancel this sign-in
            </button>
          </>
        )}
        {error && <p role="alert">{error}</p>}
        <p>
          <Link href="/cart">Continue as Guest</Link> ·{" "}
          <Link href="/guest/order">Use a private guest link</Link>
        </p>
      </section>
    </main>
  );
}
