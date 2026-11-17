import { Link } from 'wouter';
import { accountStatus } from '../lib/account-entry';

export function RestaurantAccessState({ error, retry }: { error: unknown; retry: () => void }) {
  const status = accountStatus(error);
  return <section className="roco-card" aria-label="Restaurant access">
    <h2>{status === 401 ? 'Sign in to browse private staging' : status === 403 ? 'Check your staging invitation' : 'Restaurant information could not be loaded'}</h2>
    <p role="alert">{status === 401
      ? 'This testing website restricts restaurant browsing to invited accounts and private guest links. Sign in with your invited account, or reopen your saved private guest link.'
      : status === 403
        ? 'Your current account does not have access to private staging. Check account access or contact the owner who invited you. Creating another account will not grant an invitation.'
        : 'Check your connection and try again. Restaurant availability and menu details cannot be confirmed until this information loads.'}</p>
    <div className="roco-row">
      {status === 401 && <Link className="roco-button primary" href="/sign-in">Sign in</Link>}
      {[401, 403].includes(status ?? 0) && <Link className="roco-button" href="/account/access">Check account access</Link>}
      <button className="roco-button" onClick={retry}>Retry restaurant information</button>
      <Link href="/how-it-works">How RoCoEats works</Link>
    </div>
  </section>;
}
