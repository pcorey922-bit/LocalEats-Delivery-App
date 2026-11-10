import { accountDestination, accountStatus, joinRole } from "./lib/account-entry";
import { NativeSignIn } from "./pages/native-sign-in";
import { MobileAuthorize } from "./pages/mobile-authorize";
import { Capacitor } from "@capacitor/core";
import { GuestCheckoutAccess, GuestOrderPage } from "./pages/guest-order";
import { DriverDutySession } from "./pages/driver-duty-session";
import { AccountAccess } from "./pages/account-access";
import { AccountSettings } from "./pages/account-settings";
import { workspaceLinks } from "./lib/workspace-links";
import { NotificationsPage, EarningsPage, OperationsCommerce, DeletionRequest } from './pages/commerce-pages';
import { MobileLifecycle, unregisterPush } from './lib/mobile';
import { useState } from 'react';
import { ArrowDown, ArrowRight, Menu, X, UserRound, Store, Bike, MapPin, ShieldCheck, LogOut, CircleAlert, UtensilsCrossed, RefreshCw } from 'lucide-react';
import { type ReactNode, useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClerkProvider, SignIn, SignUp, useClerk, useAuth, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { setAuthTokenGetter, getGetMyProfileQueryKey, getGetMyDashboardQueryKey, useGetMyProfile, createMyProfile, getMyProfile, useGetMyDashboard } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { DriverPage, AdminPage, CartPage, DiscoveryPage, OrdersPage, RestaurantMenuPage, RestaurantPage } from '@/pages/roco-pages';
import {
  Route,
  Redirect,
  Switch,
  useLocation,
  useSearch,
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
      <span>RoCoEats</span>
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
            <a href={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/sign-in`} data-testid="link-home-sign-in">Sign in</a>
            <a className="le-header-cta" href={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/sign-up`} data-testid="link-home-sign-up">Create account</a>
        </nav>
        <button className="le-menu" type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-controls="mobile-navigation" data-testid="button-mobile-menu">
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
        <nav className={`le-mobile-nav${menuOpen ? ' open' : ''}`} id="mobile-navigation" aria-label="Mobile navigation" data-testid="nav-mobile">
          <a href="#why-local" onClick={closeMenu} data-testid="link-mobile-why-local">Why local</a>
          <a href="#how-it-starts" onClick={closeMenu} data-testid="link-mobile-how-it-starts">How it starts</a>
          <a href="#launch-note" onClick={closeMenu} data-testid="link-mobile-launch-note">A note on launch</a>
          <a href={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/sign-in`} onClick={closeMenu} data-testid="link-mobile-sign-in">Sign in</a>
          <a href={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/sign-up`} onClick={closeMenu} data-testid="link-mobile-sign-up">Create account</a>
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
            LocalEats is still in development. Accounts are open for getting started, but restaurant listings, ordering, driver enrollment, and payments aren’t active yet. We’ll share more as the pieces come together.
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

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

function stripBase(path: string) {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#efbd68',
    colorForeground: '#f3f0e7',
    colorMutedForeground: '#aab8c9',
    colorDanger: '#d98367',
    colorBackground: '#172438',
    colorInput: '#111e30',
    colorInputForeground: '#f3f0e7',
    colorNeutral: '#31435b',
    fontFamily: 'DM Sans, sans-serif',
    borderRadius: '0.75rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#172438] rounded-2xl w-[440px] max-w-full overflow-hidden border border-[#31435b]',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#f3f0e7] font-semibold',
    headerSubtitle: 'text-[#aab8c9]',
    socialButtonsBlockButtonText: 'text-[#f3f0e7] font-semibold',
    formFieldLabel: 'text-[#d4dfeb] font-semibold',
    footerActionLink: 'text-[#efbd68] font-semibold',
    footerActionText: 'text-[#aab8c9]',
    dividerText: 'text-[#aab8c9]',
    identityPreviewEditButton: 'text-[#efbd68]',
    formFieldSuccessText: 'text-[#b5d9bd]',
    alertText: 'text-[#ffd1c4]',
    logoBox: 'rounded-xl',
    logoImage: 'rounded-lg',
    socialButtonsBlockButton: 'border-[#31435b] bg-[#1d2d43] hover:bg-[#263951]',
    formButtonPrimary: 'bg-[#efbd68] hover:bg-[#f4ca82] text-[#172235]',
    formFieldInput: 'bg-[#111e30] border-[#31435b] text-[#f3f0e7]',
    footerAction: 'text-[#718074]',
    dividerLine: 'bg-[#31435b]',
    alert: 'bg-[#382c27] border-[#784b45]',
    otpCodeFieldInput: 'border-[#31435b] bg-[#111e30]',
    formFieldRow: 'text-[#d4dfeb]',
    main: 'text-[#f3f0e7]',
  },
};

function BrandLink() {
  return <a className="portal-brand" href={basePath || '/'} data-testid="link-portal-brand"><img src={`${basePath}/logo.svg`} alt="" />RoCoEats</a>;
}

function PortalHeader({ active }: { active: 'dashboard' | 'account' }) {
  const { signOut } = useClerk();
  const profile = useProfileQuery();
  return <header className="portal-topbar">
    <BrandLink />
    <nav className="portal-nav" aria-label="Account navigation" data-testid="nav-account">
      <a className={active === 'dashboard' ? 'portal-nav-current' : ''} href={`${basePath}/dashboard`} data-testid="link-dashboard">Dashboard</a>
      <a className={active === 'account' ? 'portal-nav-current' : ''} href={`${basePath}/account`} data-testid="link-account">Account</a>
      <a href={`${basePath}/account/access`}>Access check</a>
      {profile.data?.role === 'admin' && <a href={`${basePath}/admin`}>Administrator</a>}
      {['admin','driver'].includes(profile.data?.role??'') && <a href={`${basePath}/driver`}>Driver</a>}
      <button type="button" onClick={async () => { await unregisterPush().catch(()=>{}); await signOut({ redirectUrl: basePath || '/' }); }} data-testid="button-logout"><LogOut size={14} /> Log out</button>
    </nav>
  </header>;
}

function LoadingView({ label = 'Loading your RoCoEats account' }: { label?: string }) {
  return <main className="portal"><div className="portal-shell"><div className="portal-topbar"><BrandLink /></div><section className="portal-main" aria-label={label} data-testid="status-loading"><div className="portal-skeleton portal-loading-block" style={{ width: 130 }} /><div className="portal-skeleton portal-loading-block" style={{ width: 'min(480px, 90%)', height: 48 }} /><div className="portal-skeleton portal-loading-block" style={{ width: 'min(610px, 95%)' }} /><div className="portal-grid"><div className="portal-panel"><div className="portal-skeleton portal-loading-block" /><div className="portal-skeleton portal-loading-block" /><div className="portal-skeleton portal-loading-block" style={{ height: 140 }} /></div><div className="portal-aside"><div className="portal-skeleton portal-loading-block" /><div className="portal-skeleton portal-loading-block" /></div></div></section></div></main>;
}

function QueryError({ retry, message = 'We couldn’t load this part of your account. Check your connection or account access.' }: { retry: () => void; message?: string }) {
  return <div className="portal-empty-error" role="alert" data-testid="status-load-error"><CircleAlert size={17} style={{ verticalAlign: 'middle', marginRight: 8 }} />{message}<div style={{ marginTop: 14 }}><button className="portal-primary" type="button" onClick={retry} data-testid="button-retry"><RefreshCw size={14} /> Try again</button> <a href={`${basePath}/account/access`}>Check account access</a></div></div>;
}

function useProfileQuery() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  return useGetMyProfile({ query: { queryKey: [...getGetMyProfileQueryKey(), userId], enabled: !!isLoaded && !!isSignedIn, networkMode: 'always', retry: false } });
}

function isNotFound(error: unknown) {
  const candidate = error as { status?: number; response?: { status?: number } } | null;
  return candidate?.status === 404 || candidate?.response?.status === 404;
}

function HomeRedirect() {
  const { isLoaded, isSignedIn } = useAuth();
  const profile = useProfileQuery();
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    if (profile.data) setLocation('/dashboard', { replace: true });
    else if (profile.isError && isNotFound(profile.error)) setLocation('/account/setup', { replace: true });
  }, [isLoaded, isSignedIn, profile.data, profile.isError, profile.error, setLocation]);
  if (!isLoaded) return <SessionLoading />;
  if (isSignedIn && profile.isError && !isNotFound(profile.error)) return <main className="portal"><div className="portal-shell"><div className="portal-topbar"><BrandLink /></div><section className="portal-main"><div className="portal-eyebrow">Your RoCoEats account</div><h1 className="portal-title">One moment, <em>neighbor.</em></h1><QueryError retry={() => profile.refetch()} message="We couldn’t check your RoCoEats profile." /></section></div></main>;
  if (isSignedIn) return <LoadingView />;
  return <Home />;
}

function SessionLoading() {
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const timeout = window.setTimeout(() => setTimedOut(true), 15000);
    return () => window.clearTimeout(timeout);
  }, []);
  if (!timedOut) return <LoadingView label="Connecting to sign-in" />;
  return <main className="roco-main"><h1>Sign-in is taking longer than expected</h1>
    <p role="alert">Check your connection, then reload this page to try again.</p>
    <button className="roco-button" onClick={() => window.location.reload()}>Reload page</button>
  </main>;
}

function Protected({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <SessionLoading />;
  if (!isSignedIn) return <Redirect to="/" />;
  return <>{children}</>;
}

function useJoinLinks() {
  const params = new URLSearchParams(useSearch());
  const role = joinRole(params.get('join'));
  const checkout = role === 'customer' && params.get('checkout') === '1';
  const query = `?join=${role}${checkout ? '&checkout=1' : ''}`;
  return { role, checkout, query, setup: `/account/setup${query}` };
}

function SignInPage() {
  const { role, checkout, query, setup } = useJoinLinks();
  if(Capacitor.isNativePlatform())return <NativeSignIn role={role} checkout={checkout}/>;
  return <div className="portal-auth-backdrop" data-testid="page-sign-in">
    <section className="portal-auth-story"><BrandLink /><div className="portal-auth-copy"><div className="portal-eyebrow" style={{ color: '#e8b35e' }}>A neighborly start</div><h1>Good food,<br />closer to <em>home.</em></h1><p>Your RoCoEats account is the first step toward a more connected food community in Roane County.</p></div><div className="portal-auth-foot">ROANE COUNTY, TENNESSEE · LOCAL FOOD, LOCAL PEOPLE</div></section>
    <section className="portal-auth-form"><a className="roco-button" href="/cart">Continue as Guest</a><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up${query}`} forceRedirectUrl={`${basePath}${setup}`} signUpForceRedirectUrl={`${basePath}${setup}`} /></section>
  </div>;
}

function SignUpPage() {
  const { role, checkout, query, setup } = useJoinLinks();
  if(Capacitor.isNativePlatform())return <NativeSignIn role={role} checkout={checkout}/>;
  return <div className="portal-auth-backdrop" data-testid="page-sign-up">
    <section className="portal-auth-story"><BrandLink /><div className="portal-auth-copy"><div className="portal-eyebrow" style={{ color: '#e8b35e' }}>Made for Roane County</div><h1>There’s room<br />at the <em>table.</em></h1><p>Create your account to continue.</p></div><div className="portal-auth-foot">A LOCAL IDEA TAKING SHAPE IN ROANE COUNTY</div></section>
    <section className="portal-auth-form"><a className="roco-button" href="/cart">Continue as Guest</a><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in${query}`} forceRedirectUrl={`${basePath}${setup}`} signInForceRedirectUrl={`${basePath}${setup}`} /></section>
  </div>;
}


function AccountSetup() {
  const { role, checkout, query } = useJoinLinks();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { userId } = useAuth();
  const [, setLocation] = useLocation();
  const client = useQueryClient();
  const profile = useProfileQuery();
  const provision = useMutation({
    networkMode: 'always',
    mutationFn: async (displayName: string) => {
      try { return await createMyProfile({ role, displayName }); }
      catch (error) {
        if (accountStatus(error) !== 409) throw error;
        return getMyProfile();
      }
    },
    onSuccess: (saved) => {
      client.setQueryData([...getGetMyProfileQueryKey(), userId], saved);
    },
  });
  const attempted = useRef(false);
  const missing = profile.isError && isNotFound(profile.error);
  const start = () => provision.mutate((user?.fullName?.trim() || (role === 'restaurant' ? 'Restaurant partner' : role === 'driver' ? 'RoCoEats driver' : 'RoCoEats customer')).slice(0, 120));
  useEffect(() => {
    if (profile.data) setLocation(accountDestination(profile.data.role, checkout), { replace: true });
    else if (missing && isLoaded && userId && !attempted.current) {
      attempted.current = true;
      start();
    }
  }, [profile.data, checkout, missing, isLoaded, userId, setLocation]);
  if (!isLoaded) return <SessionLoading />;
  if (!userId) return <Redirect to={`/sign-in${query}`} />;
  if (provision.isError || profile.isError && !missing) {
    const error = provision.error ?? profile.error;
    const status = accountStatus(error);
    return <main className="portal"><div className="portal-shell"><PortalHeader active="account"/><section className="portal-main">
      <h1>Let’s finish your setup</h1>
      {status === 403 ? <><p role="alert">This account does not have access to the workspace. Private staging requires an invitation.</p><a href={`${basePath}/account/access`}>Check account access</a></> :
        status === 401 ? <button className="roco-button" onClick={() => void signOut({ redirectUrl: `${basePath}/sign-in${query}` }).catch(() => window.location.reload())}>Sign in again to continue</button> :
        <QueryError retry={() => provision.isError ? start() : void profile.refetch()} message="We couldn’t finish connecting your account. Check your connection and try again." />}
    </section></div></main>;
  }
  return <LoadingView label="Preparing your workspace" />;
}

function AccountPage() {
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const profile = useProfileQuery();
  useEffect(() => {
    if (profile.data) return;
    if (profile.isError && isNotFound(profile.error)) setLocation('/account/setup', { replace: true });
  }, [profile.data, profile.isError, profile.error, setLocation]);
  if (profile.isLoading || !profile.data && profile.isError && isNotFound(profile.error)) return <LoadingView label="Loading profile" />;
  return <Protected><main className="portal" data-testid="page-account"><div className="portal-shell"><PortalHeader active="account" /><section className="portal-main">
    <div className="portal-eyebrow">Your LocalEats profile</div><h1 className="portal-title">Account, <em>at a glance.</em></h1><p className="portal-lede">Your account details and how you’re connected to the LocalEats community.</p>
    {profile.isError ? <div style={{ marginTop: 30 }}><QueryError retry={() => profile.refetch()} /></div> : profile.data && <div className="portal-grid"><section className="portal-panel" data-testid="panel-profile-details"><h2>Profile details</h2><p className="portal-panel-intro">This is the information attached to your LocalEats profile.</p>
      <div className="portal-profile-row"><span className="portal-profile-label">Display name</span><span className="portal-profile-value" data-testid="text-profile-name">{profile.data.displayName}</span></div>
      <AccountSettings displayName={profile.data.displayName}/>
      <div className="portal-profile-row"><span className="portal-profile-label">Role</span><span className="portal-profile-value"><span className="portal-role-badge" data-testid="text-profile-role">{profile.data.role}</span></span></div>
      <div className="portal-profile-row"><span className="portal-profile-label">Account ID</span><span className="portal-profile-value" data-testid="text-profile-id">{profile.data.id}</span></div>
      <div className="portal-profile-row"><span className="portal-profile-label">Clerk user ID</span><span className="portal-profile-value" data-testid="text-clerk-user-id">{user?.id || 'Not available'}</span></div>
      <div className="portal-profile-row"><span className="portal-profile-label">Member since</span><span className="portal-profile-value" data-testid="text-profile-created">{new Date(profile.data.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
    </section><aside className="portal-aside"><div className="portal-aside-mark"><UserRound size={18} /></div><h3>Sign-in identity</h3><p>Your authentication is managed securely through LocalEats. Your email address is not shown as a public listing.</p><div className="portal-aside-rule" /><div className="portal-aside-foot" data-testid="text-account-email">{user?.primaryEmailAddress?.emailAddress || 'Email address unavailable'}</div></aside></div>}
  </section></div></main></Protected>;
}

function DashboardPage() {
  const [, setLocation] = useLocation();
  const profile = useProfileQuery();
  const dashboard = useGetMyDashboard({ query: { queryKey: [...getGetMyDashboardQueryKey(), profile.data?.id], enabled: !!profile.data, networkMode: 'always', retry: false } });
  useEffect(() => {
    if (!profile.data && profile.isError && isNotFound(profile.error)) setLocation('/account/setup', { replace: true });
  }, [profile.data, profile.isError, profile.error, setLocation]);
  if (profile.isLoading || !profile.data && profile.isError && isNotFound(profile.error)) return <LoadingView label="Loading your dashboard" />;
  return <Protected><main className="portal" data-testid="page-dashboard"><div className="portal-shell"><PortalHeader active="dashboard" /><section className="portal-main">
    {profile.isError && !isNotFound(profile.error) ? <><div className="portal-eyebrow">Your LocalEats home</div><h1 className="portal-title">A place in the <em>community.</em></h1><div style={{ marginTop: 28 }}><QueryError retry={() => profile.refetch()} /></div></> : dashboard.isLoading ? <LoadingView label="Loading dashboard sections" /> : dashboard.isError ? <><div className="portal-eyebrow">Your LocalEats home</div><h1 className="portal-title">A place in the <em>community.</em></h1><div style={{ marginTop: 28 }}><QueryError retry={() => dashboard.refetch()} /></div></> : dashboard.data && <>
      <div className="portal-eyebrow">{dashboard.data.role} dashboard · Roane County</div><h1 className="portal-title">Welcome, <em>{dashboard.data.displayName}.</em></h1><p className="portal-lede">Your LocalEats space is ready. Here’s what’s part of your {dashboard.data.role} experience.</p>
      <div className="portal-grid"><section className="portal-panel" data-testid="panel-dashboard-sections"><h2>Your dashboard</h2><p className="portal-panel-intro">Open your workspace to manage actual records. Ordering remains controlled by the server’s staging settings.</p>
        <div className="portal-section-list" data-testid="list-dashboard-sections">{workspaceLinks(dashboard.data.role).map((section, index) => <a href={`${basePath}${section.href}`} className="portal-section-item" key={section.href} data-testid={`item-dashboard-section-${index}`}><span className="portal-section-number">{String(index + 1).padStart(2, '0')}</span><div><strong>{section.title}</strong><p>{section.detail}</p></div><ArrowRight size={18}/></a>)}</div>
        {!dashboard.data.sections.length && <div className="portal-empty-error" data-testid="status-no-sections">No dashboard sections are available for this profile yet.</div>}
        <div className="portal-status-note"><ShieldCheck size={16} /><span>Private staging · Stripe TEST only. Restaurant and driver approvals still apply. Check Account access if your owner controls are missing.</span></div>
      </section><aside className="portal-aside"><div className="portal-aside-mark"><UtensilsCrossed size={18} /></div><h3>Built around here.</h3><p>Local food and local people come first. We’re building the pieces carefully before service begins.</p><div className="portal-aside-rule" /><div className="portal-aside-foot"><MapPin size={15} />Roane County, Tennessee</div></aside></div>
    </>}
  </section></div></main></Protected>;
}

function SignedInCheckout() {
  const { isLoaded, isSignedIn } = useAuth();
  const profile = useProfileQuery();
  if (!isLoaded) return <SessionLoading />;
  if (isSignedIn && profile.isLoading) return <LoadingView label="Preparing checkout" />;
  if (isSignedIn && profile.isError) {
    if (isNotFound(profile.error)) return <Redirect to="/account/setup?join=customer&checkout=1" />;
    return <main className="roco-main"><h1>Checkout</h1><QueryError retry={() => void profile.refetch()} /></main>;
  }
  return <GuestCheckoutAccess><CartPage /></GuestCheckoutAccess>;
}

function Router() {
  return <RoutedErrorBoundary><Switch>
    <Route path="/" component={DiscoveryPage} />
    <Route path="/restaurants/:restaurantId" component={RestaurantMenuPage} />
    <Route path="/cart" component={SignedInCheckout} />
    <Route path="/mobile/authorize" component={MobileAuthorize} />
    <Route path="/guest/order" component={GuestOrderPage} />
    <Route path="/orders" component={() => <Protected><OrdersPage /></Protected>} />
    <Route path="/restaurant" component={() => <Protected><RestaurantPage /></Protected>} />
    <Route path="/account/delete" component={() => <Protected><DeletionRequest /></Protected>} />
    <Route path="/account/access" component={() => <Protected><AccountAccess /></Protected>} />
    <Route path="/notifications" component={() => <Protected><NotificationsPage /></Protected>} />
    <Route path="/earnings" component={() => <Protected><EarningsPage /></Protected>} />
    <Route path="/operations" component={() => <Protected><OperationsCommerce /></Protected>} />
    <Route path="/driver" component={() => <Protected><DriverPage /></Protected>} />
    <Route path="/admin" component={() => <Protected><AdminPage /></Protected>} />
    <Route path="/sign-in/*?" component={SignInPage} />
    <Route path="/sign-up/*?" component={SignUpPage} />
    <Route path="/account/setup" component={AccountSetup} />
    <Route path="/account" component={() => <Protected><AccountPage /></Protected>} />
    <Route path="/dashboard" component={() => <Protected><DashboardPage /></Protected>} />
    <Route component={NotFound} />
  </Switch></RoutedErrorBoundary>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) queryClient.clear();
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);
  return null;
}

function ApiAuthentication() {
  const { getToken } = useAuth();
  useEffect(() => {
    if (!import.meta.env.VITE_API_ORIGIN) return;
    setAuthTokenGetter(() => getToken());
    return () => setAuthTokenGetter(null);
  }, [getToken]);
  return null;
}

function ClerkRoutes() {
  const [, setLocation] = useLocation();
  if (!clerkPubKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');
  return <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={clerkAppearance} signInUrl={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`}
    localization={{ signIn: { start: { title: 'Welcome back', subtitle: 'Sign in to your RoCoEats account' } }, signUp: { start: { title: 'Find your place here', subtitle: 'Create your RoCoEats account' } } }}
    routerPush={(to) => setLocation(stripBase(to))} routerReplace={(to) => setLocation(stripBase(to), { replace: true })}>
    <ApiAuthentication /><MobileLifecycle /><ClerkQueryClientCacheInvalidator /><DriverDutySession /><Router />
  </ClerkProvider>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={basePath}>
          <ClerkRoutes />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
