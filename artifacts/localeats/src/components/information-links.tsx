import { Link } from 'wouter';

export function InformationLinks() {
  return <nav aria-label="RoCoEats information" className="roco-info-links">
    <Link href="/about">About</Link><Link href="/how-it-works">How it works</Link>
    <Link href="/support">Contact &amp; support</Link><Link href="/faq">FAQ</Link>
    <Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link>
  </nav>;
}
