import { ArrowRight, Bike, MapPin, ShoppingBag, Store, UserRound, UtensilsCrossed } from 'lucide-react';
import { Link } from 'wouter';

const actions = [
  { title: 'Sign In', href: '/sign-in', icon: UserRound },
  { title: 'Order as Guest', href: '/restaurants?guest=1', icon: ShoppingBag },
  { title: 'Browse Restaurants & Menus', href: '/restaurants', icon: UtensilsCrossed },
  { title: 'Partner With RoCoEats', href: '/sign-up?join=restaurant', icon: Store },
  { title: 'Drive With RoCoEats', href: '/sign-up?join=driver', icon: Bike },
];

export function HomePage() {
  return <div className="roco-home" data-testid="page-home">
    <a className="roco-home-skip" href="#home-actions">Skip to your next step</a>
    <header className="roco-home-header">
      <Link className="roco-home-brand" href="/" aria-label="RoCoEats home">
        <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" width="48" height="48" />
        <span>RoCoEats</span>
      </Link>
      <span className="roco-home-location"><MapPin size={16} aria-hidden="true" /> Roane County, Tennessee</span>
    </header>
    <main className="roco-home-main">
      <div className="roco-home-kicker">Local food. Local people.</div>
      <h1>Good food.<br /><em>Closer to home.</em></h1>
      <p className="roco-home-intro">Discover the flavors of Roane County and connect with the people who make our community special.</p>
      <nav className="roco-home-actions" id="home-actions" aria-label="Get started with RoCoEats" tabIndex={-1}>
        {actions.map(({ title, href, icon: Icon }) => <Link className="roco-home-action" href={href} key={title}>
          <Icon size={23} aria-hidden="true" /><span>{title}</span><ArrowRight size={21} aria-hidden="true" />
        </Link>)}
      </nav>
      <p className="roco-home-status">We’re preparing for launch. You can explore restaurants and menus; ordering and payments are currently closed.</p>
      <p className="roco-home-help">Already placed a guest test order? <Link href="/guest/order">Track your guest order</Link></p>
    </main>
    <footer className="roco-home-footer">Made for Roane County, Tennessee.<span>Local food. Local drivers. Delivered.</span></footer>
  </div>;
}
