import { nativeAccountReturn, type JoinRole } from "../lib/account-entry";
import { useEffect, useRef, useState } from "react";
import {useAuth,useWebSignIn,usesNativeClerk,nativeClerk} from "../lib/auth";
import { Browser } from "@capacitor/browser";
import { Link, useLocation } from "wouter";
import { customFetch } from "../../../../lib/api-client-react/src/custom-fetch";
import { readNativeRequest, saveNativeRequest, clearNativeRequest, runNativeRequest, nativeRequestRunning, type NativeRequest } from '../lib/native-auth-request';
import { nativeStartup, nativeStep, NativeStepError } from '../lib/native-startup';
const encoded = (v: Uint8Array) =>
  btoa(String.fromCharCode(...v))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
export function NativeSignIn({ role, checkout = false }: { role?: JoinRole; checkout?: boolean } = {}) {
  const driverApp = import.meta.env.VITE_APP_AUDIENCE === 'driver';
  const [pending, setPending] = useState<NativeRequest | null>(readNativeRequest),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const { isLoaded, isSignedIn } = useAuth(),
    signIn = useWebSignIn()?.signIn,
    latest = useRef(signIn);
  latest.current = signIn;
  const starting = useRef(false);
  const [, navigate] = useLocation();
  const signedIn = useRef(isSignedIn); signedIn.current = isSignedIn;
  useEffect(() => { if (!pending && isLoaded && !busy) nativeStartup.report('READY', true); }, [pending, isLoaded, busy]);
  useEffect(() => {
    if (!pending || !isLoaded) return;
    let detached = false;
    if (signedIn.current && !nativeRequestRunning(pending.id)) {
      clearNativeRequest(pending.id); setPending(null); nativeStartup.report('PROFILE');
      navigate(nativeAccountReturn(pending.role, pending.checkout === true, !driverApp)); return;
    }
    void runNativeRequest(pending, async signal => {
      while (true) {
        signal.throwIfAborted();
        if (Date.parse(pending.expiresAt) <= Date.now()) throw new NativeStepError('NATIVE_APPROVAL_EXPIRED');
        if (!nativeStartup.isForeground()) { await new Promise(resolve => setTimeout(resolve, 500)); continue; }
        nativeStartup.report('REDEEMING');
        saveNativeRequest({ ...pending, phase: 'redeeming' });
        const response = await nativeStep('NATIVE_REDEEM_TIMEOUT', () => customFetch<{ pending?: boolean; ticket?: string }>('/api/mobile/auth/redeem', {
          method: 'POST', signal, body: JSON.stringify({ id: pending.id, verifier: pending.verifier }),
        }), signal);
        if (response.ticket) {
          // Never persist a ticket. Mark consumption so a killed process cannot
          // silently redeem the same one-use request and demand repeated approval.
          saveNativeRequest({ ...pending, phase: 'activating' });
          nativeStartup.report('TICKET');
          if(usesNativeClerk()){
            await nativeClerk.activateTicket(response.ticket,pending.id,signal);
          }else{
            const signer=latest.current;if(!signer)throw new NativeStepError('NATIVE_TICKET_REJECTED');
          const result = await nativeStep('NATIVE_TICKET_TIMEOUT', () => signer.ticket({ ticket: response.ticket! }), signal);
          if (result.error) throw new NativeStepError('NATIVE_TICKET_REJECTED');
          nativeStartup.report('ACTIVATING');
          let activationConfirmed = false;
          const finalSigner=latest.current;if(!finalSigner)throw new NativeStepError('NATIVE_ACTIVATION_REJECTED');
          const finalized = await nativeStep('NATIVE_ACTIVATION_TIMEOUT', () => finalSigner.finalize({ navigate: async ({ session }) => {
            if (session.status !== 'active' || session.currentTask) throw new NativeStepError('NATIVE_SESSION_TASK_REQUIRED');
            activationConfirmed = true;
            // Router navigation happens AFTER Clerk emits its activated session.
            // An incomplete session must not redirect into hosted tasks/WebView UI.
          } }), signal);
          if (finalized.error) throw finalized.error instanceof NativeStepError ? finalized.error : new NativeStepError('NATIVE_ACTIVATION_REJECTED');
          if (!activationConfirmed) throw new NativeStepError('NATIVE_ACTIVATION_UNCONFIRMED');
          }
          signal.throwIfAborted(); return;
        }
        if (!response.pending) throw new NativeStepError('NATIVE_REDEEM_RESPONSE_INVALID');
        saveNativeRequest({ ...pending, phase: 'waiting' });
        nativeStartup.report('WAITING_APPROVAL', true);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }).then(() => {
      if (detached) return;
      clearNativeRequest(pending.id); setPending(null); nativeStartup.report('PROFILE');
      // Browser dismissal is optional UX. It MUST NOT gate navigation or startup.
      void Browser.close().catch(() => {});
      navigate(nativeAccountReturn(pending.role, pending.checkout === true, !driverApp));
    }).catch(cause => {
      if (detached || cause instanceof NativeStepError && cause.code === 'NATIVE_HANDOFF_CANCELED' && readNativeRequest()?.id !== pending.id) return;
      clearNativeRequest(pending.id); setPending(null); nativeStartup.block(cause instanceof NativeStepError ? cause.code : 'NATIVE_HANDOFF_FAILED');
      setError(cause instanceof NativeStepError ? cause.message : 'Secure sign-in did not finish. Code: NATIVE_HANDOFF_FAILED. Start again.');
    });
    return () => { detached = true; }; // Single-flight owns cancellation, not route remounts.
  }, [pending, isLoaded, navigate]);
  async function start() {
    if (starting.current || readNativeRequest() || nativeStartup.get().failure) return;
    starting.current = true;
    setBusy(true);
    setError("");
    nativeStartup.report('BROWSER_OPEN');
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
      if (nativeStartup.get().failure) throw new NativeStepError('NATIVE_START_CANCELED_RELOAD');
      const response = await customFetch<{
        id: string;
        expiresAt: string;
        authorizationUrl: string;
      }>("/api/mobile/auth/start", {
        method: "POST",
        body: JSON.stringify({ challenge }),
      });
      if (nativeStartup.get().failure) throw new NativeStepError('NATIVE_START_CANCELED_RELOAD');
      const url = new URL(response.authorizationUrl);
      if (
        url.origin !== import.meta.env.VITE_API_ORIGIN ||
        url.pathname !== "/mobile/authorize" ||
        url.search ||
        url.username ||
        url.password
      )
        throw Error("Unsafe sign-in destination rejected");
      const saved: NativeRequest = {
        phase: "waiting",
        id: response.id,
        expiresAt: response.expiresAt,
        verifier,
        role,
        checkout,
      };
      if (import.meta.env.VITE_APP_AUDIENCE === 'driver') {
        const fragment = new URLSearchParams(url.hash.slice(1));
        fragment.set('app', 'driver');
        url.hash = fragment.toString();
      }
      saveNativeRequest(saved);
      setPending(saved);
      nativeStartup.report('BROWSER_OPEN');
      await nativeStep('NATIVE_BROWSER_OPEN_TIMEOUT', () => Browser.open({ url: url.toString() }), new AbortController().signal);
      nativeStartup.report('WAITING_APPROVAL', true);
    } catch (cause) {
      clearNativeRequest(); setPending(null); nativeStartup.block(cause instanceof NativeStepError ? cause.code : 'NATIVE_START_FAILED');
      setError(cause instanceof NativeStepError ? cause.message : 'Secure sign-in could not start. Code: NATIVE_START_FAILED. Reload the app.');
    } finally {
      starting.current = false;
      setBusy(false);
    }
  }
  return (
    <main className="roco-main">
      <section className="roco-card">
        <Link href={driverApp ? "/driver" : "/"}>{driverApp ? "RoCoEats Driver · Driver access" : "RoCoEats · Home"}</Link>
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
                const phase = readNativeRequest()?.phase;
                if (phase === 'activating') nativeStartup.block('NATIVE_ACTIVATION_CANCELED_RELOAD');
                clearNativeRequest(); setPending(null);
              }}
            >
              Cancel this sign-in
            </button>
          </>
        )}
        {error && <p role="alert">{error}</p>}
        {!driverApp && <p>
          <Link href="/cart">Continue as Guest</Link> ·{" "}
          <Link href="/guest/order">Use a private guest link</Link>
        </p>}
      </section>
    </main>
  );
}
