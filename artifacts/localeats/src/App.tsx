import { useState } from 'react';
import { ArrowDown, ArrowRight, Menu, X } from 'lucide-react';
import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

type Interest = 'neighbor' | 'restaurant' | 'driver';

function BrandMark() {
  return (
    <span className="le-brand-mark" aria-hidden="true">
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
        <path d="M12 20.2c-4.8-2.8-7.5-6-7.5-9.6 0-2.5 1.7-4.1 3.8-4.1 1.5 0 2.8.9 3.7 2.4.9-1.5 2.2-2.4 3.7-2.4 2.1 0 3.8 1.6 3.8 4.1 0 3.6-2.7 6.8-7.5 9.6Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M12 8.7c-.2-2.3.8-4 3.1-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M12 11.5c-.8 1.4-1.7 2.5-3 3.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function Brand({ footer = false }: { footer?: boolean }) {
  return (
    <a className="le-brand" href="#home" data-testid={footer ? 'link-footer-brand' : 'link-home-brand'} aria-label="LocalEats home">
      <BrandMark />
      <span>LocalEats</span>
    </a>
  );
}

function PlateIllustration() {
  return (
    <div className="le-art" aria-label="Illustration of a colorful meal on a plate" role="img" data-testid="illustration-local-meal">
      <div className="le-orbit" />
      <div className="le-art-sun" />
      <span className="le-art-star one" aria-hidden="true" />
      <span className="le-art-star two" aria-hidden="true" />
      <div className="le-plate">
        <div className="le-plate-inner">
          <svg className="le-food-art" viewBox="0 0 220 220" fill="none" aria-hidden="true">
            <path d="M31 127c8-40 38-71 82-75 31-3 60 13 74 39 15 28 7 62-14 82-21 20-62 24-96 10-31-13-52-30-46-56Z" fill="#D96843" />
            <path d="M45 111c9-31 34-49 62-52 26-3 46 8 54 24-18 4-34 16-40 34-8 22 1 41 17 53-28 10-58 2-76-13-15-13-22-29-17-46Z" fill="#E9AC58" />
            <path d="M86 68c15-10 36-12 54-4-5 10-13 18-25 22-12 4-24 2-34-4" fill="#557459" />
            <path d="M130 101c13-16 31-20 45-15 9 18 10 39 2 56-16 3-31-3-39-15-6-9-9-18-8-26Z" fill="#78916A" />
            <path d="M54 130c9-13 20-18 31-15 8 3 12 12 8 20-5 10-19 16-32 12-8-3-11-10-7-17Z" fill="#F4D58E" />
            <circle cx="104" cy="113" r="12" fill="#F3E8CD" />
            <circle cx="106" cy="111" r="4" fill="#D96843" />
            <circle cx="150" cy="66" r="6" fill="#F6EBCF" />
            <circle cx="66" cy="83" r="4" fill="#F6EBCF" />
            <path d="M80 156c12 7 27 11 42 10M148 145c8-5 14-12 17-20" stroke="#F6EBCF" strokeWidth="3" strokeLinecap="round" opacity=".75" />
            <path d="M65 98c2-7 5-12 10-17M124 163c6-1 11-3 16-6" stroke="#557459" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      </div>
      <div className="le-art-label"><span>A little closer to home</span><strong>Roane County, TN</strong></div>
    </div>
  );
}

function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [interest, setInterest] = useState<Interest>('neighbor');

  const interestCopy: Record<Interest, string> = {
    neighbor: 'We’re working toward a simple way to discover local food and have it brought by a local driver. Ordering isn’t open yet.',
    restaurant: 'Restaurant listings and partner onboarding are still being built. We’re not enrolling businesses just yet.',
    driver: 'Local delivery is part of the plan. Driver enrollment and delivery routes aren’t available yet.',
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <main className="le-page" id="home" data-testid="page-home">
      <header className="le-wrap le-header" data-testid="header-main">
        <Brand />
        <nav className="le-nav" aria-label="Main navigation" data-testid="nav-main">
          <a href="#why-local" data-testid="link-why-local">Why local</a>
          <a href="#how-it-starts" data-testid="link-how-it-starts">How it starts</a>
          <a className="le-header-cta" href="#launch-note" data-testid="link-launch-note">A note on launch</a>
        </nav>
        <button className="le-menu" type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-controls="mobile-navigation" data-testid="button-mobile-menu">
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
        <nav className={`le-mobile-nav${menuOpen ? ' open' : ''}`} id="mobile-navigation" aria-label="Mobile navigation" data-testid="nav-mobile">
          <a href="#why-local" onClick={closeMenu} data-testid="link-mobile-why-local">Why local</a>
          <a href="#how-it-starts" onClick={closeMenu} data-testid="link-mobile-how-it-starts">How it starts</a>
          <a href="#launch-note" onClick={closeMenu} data-testid="link-mobile-launch-note">A note on launch</a>
        </nav>
      </header>

      <section className="le-hero" aria-labelledby="hero-title">
        <div className="le-hero-inner">
          <div className="le-hero-copy">
            <div className="le-eyebrow" data-testid="text-location">Made for Roane County, Tennessee</div>
            <h1 id="hero-title" data-testid="heading-hero">Good food.<br />Close to <em>home.</em></h1>
            <p className="le-tagline" data-testid="text-tagline">Local food. Local drivers. Delivered.</p>
            <p className="le-hero-intro" data-testid="text-hero-intro">
              A neighborly new way to bring Roane County’s food community a little closer together.
            </p>
            <div className="le-hero-actions">
              <a className="le-button" href="#how-it-starts" data-testid="button-explore-story">
                Get to know LocalEats <ArrowRight size={16} />
              </a>
              <a className="le-text-link" href="#launch-note" data-testid="link-launch-details">A quick note on where we are</a>
            </div>
          </div>
          <PlateIllustration />
        </div>
      </section>

      <div className="le-ticker" aria-label="Serving Roane County, Tennessee" data-testid="text-service-area">
        <span>Rooted in Roane County</span><i className="le-ticker-dot" />
        <span>Made for our neighbors</span><i className="le-ticker-dot" />
        <span>Built around local food</span>
      </div>

      <section className="le-intro le-wrap" id="why-local" aria-labelledby="why-title">
        <div className="le-section-kicker">A little more local</div>
        <h2 id="why-title" data-testid="heading-why-local">The best things travel<br />better <em>together.</em></h2>
        <p data-testid="text-why-local">
          LocalEats is being built around a simple idea: local restaurants, local drivers, and the people who make a community feel like home.
        </p>
        <div className="le-principles" data-testid="group-local-principles">
          <article className="le-principle" data-testid="card-principle-community">
            <span className="le-principle-no">01 / Neighbors</span>
            <h3>Made for here</h3>
            <p>Starting right here in Roane County, with the people and places that make it home.</p>
          </article>
          <article className="le-principle" data-testid="card-principle-food">
            <span className="le-principle-no">02 / Food</span>
            <h3>Rooted in local</h3>
            <p>A home for the food made by local restaurants and the hands behind every meal.</p>
          </article>
          <article className="le-principle" data-testid="card-principle-drivers">
            <span className="le-principle-no">03 / Delivery</span>
            <h3>Close to home</h3>
            <p>Local drivers are part of the idea, bringing neighborhood meals right to your door.</p>
          </article>
        </div>
      </section>

      <section className="le-stage" id="how-it-starts" aria-labelledby="stage-title">
        <div className="le-wrap le-stage-grid">
          <div className="le-stage-art" aria-hidden="true">
            <div className="le-stage-shape" />
            <div className="le-stage-plate">
              <svg viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="34" stroke="currentColor" strokeWidth="2" />
                <circle cx="50" cy="50" r="27" stroke="currentColor" strokeWidth="1" opacity=".55" />
                <path d="M36 52c7-14 19-19 31-14-2 12-10 21-23 25-5-3-8-7-8-11Z" fill="#C85F3D" />
                <path d="M40 44c4-9 12-13 20-13-2 7-7 12-15 14" stroke="#E8B35E" strokeWidth="3" strokeLinecap="round" />
                <path d="M42 58c5 3 11 3 16 1M57 62l7-5" stroke="#607D61" strokeWidth="3" strokeLinecap="round" />
                <circle cx="38" cy="37" r="2" fill="#C85F3D" /><circle cx="66" cy="47" r="2" fill="#C85F3D" />
              </svg>
            </div>
            <div className="le-stage-note">Small town, full of flavor</div>
          </div>
          <div className="le-stage-copy">
            <div className="le-section-kicker">One step at a time</div>
            <h2 id="stage-title" data-testid="heading-stage">First, we’re getting the table ready.</h2>
            <p data-testid="text-stage-description">
              We’re at the beginning. Before anyone can place an order, we need to build a thoughtful local network and get the details right.
            </p>
            <div className="le-stage-list" data-testid="list-launch-status">
              <div className="le-stage-item" data-testid="status-local-first"><span className="le-check" /><span>Starting in Roane County, Tennessee</span></div>
              <div className="le-stage-item" data-testid="status-restaurants"><span className="le-check" /><span>Planning a place for local restaurants to be discovered</span></div>
              <div className="le-stage-item" data-testid="status-delivery"><span className="le-check" /><span>Making local drivers part of the picture</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="le-community" id="launch-note" aria-labelledby="community-title">
        <div className="le-wrap">
          <div className="le-section-kicker">A small but important note</div>
          <h2 id="community-title" data-testid="heading-launch-note">We’re not taking orders <em>just yet.</em></h2>
          <p data-testid="text-launch-status">
            LocalEats is still in development. Restaurant listings, ordering, driver enrollment, accounts, and payments aren’t available yet. We’ll share more as the pieces come together.
          </p>
          <div className="le-community-actions">
            <a className="le-community-primary" href="#interest" data-testid="link-whats-next">What brings you here? <ArrowDown size={15} /></a>
            <a className="le-community-secondary" href="#home" data-testid="link-back-to-top">Back to the beginning</a>
          </div>
        </div>
      </section>

      <section className="le-stage" id="interest" aria-labelledby="interest-title">
        <div className="le-wrap le-interest-wrap">
          <div className="le-section-kicker">Until then</div>
          <h2 id="interest-title" data-testid="heading-interest">Who are you hoping to see here?</h2>
          <p data-testid="text-interest-intro">Choose what you’re most curious about. It won’t sign you up or send anything—just a small preview of what LocalEats is working toward.</p>
          <div className="le-interest-controls" role="group" aria-label="Choose what you are interested in" data-testid="group-interest-options">
            <button type="button" className={interest === 'neighbor' ? 'selected' : ''} aria-pressed={interest === 'neighbor'} onClick={() => setInterest('neighbor')} data-testid="button-interest-neighbor">Finding local food</button>
            <button type="button" className={interest === 'restaurant' ? 'selected' : ''} aria-pressed={interest === 'restaurant'} onClick={() => setInterest('restaurant')} data-testid="button-interest-restaurant">Local restaurants</button>
            <button type="button" className={interest === 'driver' ? 'selected' : ''} aria-pressed={interest === 'driver'} onClick={() => setInterest('driver')} data-testid="button-interest-driver">Driving locally</button>
          </div>
          <p className="le-interest-feedback" aria-live="polite" data-testid="text-interest-feedback">{interestCopy[interest]}</p>
        </div>
      </section>

      <footer className="le-footer" data-testid="footer-main">
        <div className="le-wrap le-footer-row">
          <Brand footer />
          <div className="le-footer-note" data-testid="text-footer-location">A local idea taking shape in Roane County, Tennessee.<span>Local food. Local drivers. Delivered.</span></div>
        </div>
      </footer>
    </main>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;