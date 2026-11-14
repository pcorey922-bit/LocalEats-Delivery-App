import { useState } from "react";
import { useAuth, useUser, SignIn } from "@clerk/react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { customFetch } from "../../../../lib/api-client-react/src/custom-fetch";
const key = "rocoeats-browser-auth-approval:v1";
function request() {
  try {
    const params = new URLSearchParams(location.hash.slice(1)),
      id = params.get("flow"),
      state = params.get("state");
    if (
      id &&
      state &&
      /^[a-z0-9-]{36}$/.test(id) &&
      /^[A-Za-z0-9_-]{43}$/.test(state)
    ) {
      sessionStorage.setItem(key, JSON.stringify({ id, state }));
      history.replaceState(null, "", location.pathname);
      return { id, state };
    }
    return JSON.parse(sessionStorage.getItem(key) || "null") as {
      id: string;
      state: string;
    } | null;
  } catch {
    return null;
  }
}
export function MobileAuthorize() {
  const { isLoaded, isSignedIn } = useAuth(),
    { user } = useUser(),
    [flow] = useState(request);
  const approve = useMutation({
    mutationFn: () =>
      customFetch("/api/mobile/auth/approve", {
        method: "POST",
        body: JSON.stringify(flow),
      }),
    onSuccess: () => sessionStorage.removeItem(key),
  });
  if (!flow)
    return (
      <main className="roco-main">
        <h1>Open sign-in from the app</h1>
        <p>
          Start a new request in RoCoEats. No account access was transferred.
        </p>
        <Link href="/">Home</Link>
      </main>
    );
  return (
    <main className="roco-main">
      <section className="roco-card">
        <h1>Approve RoCoEats app sign-in</h1>
        <p>
          Only continue if you just started this request in your RoCoEats app.
          This grants the app your existing account access; it does not change
          roles or enable ordering.
        </p>
        {!isLoaded ? (
          <p role="status">Loading secure sign-in…</p>
        ) : !isSignedIn ? (
          <SignIn
            routing="hash"
            forceRedirectUrl={`${location.origin}/mobile/authorize`}
            signUpForceRedirectUrl={`${location.origin}/mobile/authorize`}
          />
        ) : (
          <>
            <p>
              Signed in as{" "}
              {user?.primaryEmailAddress?.emailAddress ||
                user?.fullName ||
                "your Clerk account"}
              .
            </p>
            <button
              className="roco-button primary"
              disabled={approve.isPending || approve.isSuccess}
              onClick={() => approve.mutate()}
            >
              Approve my app sign-in
            </button>
          </>
        )}
        {approve.isError && <p role="alert">{approve.error.message}</p>}
        {approve.isSuccess && (
          <>
            <p>Approved. Return to the app to complete secure sign-in.</p>
            <a className="roco-button" href="rocoeats://auth">
              Return to RoCoEats app
            </a>
          </>
        )}
      </section>
    </main>
  );
}
