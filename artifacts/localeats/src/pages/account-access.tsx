import { useAuth } from "@clerk/react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { customFetch } from "../../../../lib/api-client-react/src/custom-fetch";
type Access = {
  ownerConfigured: boolean; ownerMatched: boolean; ownerDriverConfigured: boolean;
  ownerDriverMatched: boolean; profileStatus: string; role: string | null;
  administrator: boolean; superAdministrator: boolean; driver: boolean;
};
export function AccountAccess() {
  const { isSignedIn, userId } = useAuth();
  const [copyStatus,setCopyStatus] = useState("");
  const result = useQuery({ queryKey: ["session-access", userId], enabled: !!isSignedIn,
    queryFn: () => customFetch<Access>("/api/session/access"), retry: false, staleTime: 0 });
  const access = result.data;
  return <main className="roco-main"><Link href="/dashboard">← Dashboard</Link><h1>Account access</h1>
    <p>These permissions come from the server. Your Google sign-in must belong to the Clerk identity configured in Render.</p>
    <p>Your signed-in Clerk User ID: <code style={{overflowWrap:'anywhere'}}>{userId}</code></p>
    <button className="roco-button" onClick={async()=>{try{await navigator.clipboard.writeText(userId??'');setCopyStatus('Copied. Paste only into your protected Render settings.');}catch{setCopyStatus('Select your User ID above and copy it manually.');}}}>Copy my Clerk User ID</button>
    {copyStatus&&<p role="status">{copyStatus}</p>}
    {result.isLoading && <p role="status">Checking access…</p>}
    {result.isError && <p role="alert">Access could not be checked. Sign in again or retry. The Clerk publishable and secret keys in Render must belong to the same Development instance.</p>}
    <button className="roco-button" disabled={result.isFetching} onClick={() => void result.refetch()}>Refresh access</button>
    {access && <section className="roco-card"><dl>
      {[["Profile", access.profileStatus], ["Role", access.superAdministrator ? "Super Administrator (owner)" : access.role ?? "Setup required"],
        ["Owner setting present", access.ownerConfigured], ["Signed-in identity matches owner", access.ownerMatched],
        ["Owner-driver setting present", access.ownerDriverConfigured], ["Signed-in identity matches owner-driver", access.ownerDriverMatched],
        ["Administrator access", access.administrator], ["Driver access", access.driver]].map(([label,value]) =>
          <div className="roco-row" key={String(label)}><dt>{label}</dt><dd>{typeof value === "boolean" ? value ? "Yes" : "No" : value}</dd></div>)}
      </dl>
      {access.administrator && <p><Link className="roco-button" href="/admin">Administrator controls</Link> <Link className="roco-button" href="/operations">Dispatch and order operations</Link></p>}
      {access.driver && <p><Link className="roco-button" href="/driver">Driver workspace</Link></p>}
      {!access.ownerMatched && <p>If you are the owner, compare your signed-in Clerk User ID above with Render’s <code>LOCALEATS_ADMIN_CLERK_USER_IDS</code>. Google may have created a different Clerk identity. Enter the correct ID only in Render’s protected Environment settings and redeploy; never grant ownership by email or a client-side role.</p>}
      {access.ownerMatched && !access.ownerDriverMatched && <p>For owner-driver access, enter the same owner ID in Render’s <code>ROCOEATS_OWNER_DRIVER_CLERK_USER_IDS</code> and redeploy.</p>}
      {access.profileStatus === "setup_required" && <p><Link href="/account/setup">Complete account setup</Link></p>}
      {access.profileStatus === "suspended" && <p role="alert">This account is suspended. Bootstrap does not reactivate suspended accounts.</p>}
    </section>}
  </main>;
}
