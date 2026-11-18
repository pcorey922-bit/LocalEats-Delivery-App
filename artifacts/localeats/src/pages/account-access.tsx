import { useNativeStartup } from '../components/native-startup-boundary';
import { accountAccessResponse } from '../lib/account-response';
import { accountReadOptions, accountReadMessage, sessionRead } from '../lib/account-read';
import { useAuth } from "@clerk/react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearch } from "wouter";
import { accountEntryLinks } from '../lib/account-entry';
import { customFetch } from "../../../../lib/api-client-react/src/custom-fetch";
export function AccountSetupChoices() {
  return <div><p>Choose the account type you intended to register.</p>
    <p>{(['customer', 'restaurant', 'driver'] as const).map(role => <Link className="roco-button" key={role} href={`/account/setup?join=${role}`}>Set up as {role === 'restaurant' ? 'a restaurant' : role === 'driver' ? 'a driver' : 'a customer'}</Link>)}</p>
  </div>;
}
export function AccountAccess() {
  const entry = accountEntryLinks(useSearch());
  const { isSignedIn, userId, getToken } = useAuth();
  const [copyStatus,setCopyStatus] = useState("");
  const result = useQuery({ queryKey: ["session-access", userId], enabled: !!isSignedIn,
    queryFn: ({ signal }) => sessionRead(async (headers, requestSignal) => accountAccessResponse(await customFetch("/api/session/access", { headers, signal: requestSignal })), getToken, { signal }), ...accountReadOptions, staleTime: 0 });
  const access = result.data;
  useNativeStartup('PROFILE', result.isError || !!access);
  return <main className="roco-main"><Link href={import.meta.env.VITE_APP_AUDIENCE === 'driver' ? '/driver' : `/dashboard${entry.query}`}>{import.meta.env.VITE_APP_AUDIENCE === 'driver' ? '← Driver workspace' : '← Dashboard'}</Link><h1>Account access</h1>
    <p>These permissions come from the server. Your Google sign-in must belong to the Clerk identity configured in Render.</p>
    <p>Your signed-in Clerk User ID: <code style={{overflowWrap:'anywhere'}}>{userId}</code></p>
    <button className="roco-button" onClick={async()=>{try{await navigator.clipboard.writeText(userId??'');setCopyStatus('Copied. Paste only into your protected Render settings.');}catch{setCopyStatus('Select your User ID above and copy it manually.');}}}>Copy my Clerk User ID</button>
    {copyStatus&&<p role="status">{copyStatus}</p>}
    {result.isPending && <p role="status">Checking account permissions. If this does not finish, retry or reopen the app.</p>}
    {result.isError && <p role="alert">{accountReadMessage(result.error)}</p>}
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
      {access.privateStaging && access.stagingAdmitted === false && <p role="alert">You are signed in. This private staging account still needs an invitation.</p>}
      {access.stagingAdmitted !== false && access.profileStatus === "setup_required" && (entry.hasIntent ? <p><Link href={entry.setup}>Complete account setup</Link></p> : <AccountSetupChoices/>)}
      {access.profileStatus === "suspended" && <p role="alert">This account is suspended. Bootstrap does not reactivate suspended accounts.</p>}
    </section>}
  </main>;
}
