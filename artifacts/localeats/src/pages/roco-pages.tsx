import { CheckoutAddresses } from './checkout-addresses';
import { useGuestToken } from '../lib/guest-session';
import { accountStatus } from "../lib/account-entry";
import { RestaurantStatus } from './restaurant-status';
import { GuestDeliveryContact } from "./guest-delivery-contact";
import { RestaurantConfirmation } from "./restaurant-confirmation";
import { readGuestToken } from "../lib/guest-session";
import { RestaurantInventory } from "./inventory";
import { AdministratorAccessManager } from "./administrator-access";
import { DeclinedOffers } from "./declined-offers";
import { dutyIntent } from "../lib/duty-intent";
import { NavigationActions } from "./navigation-actions";
import { useCartForOwner, useCustomerCart } from "../hooks/use-customer-cart";
import { cartLineKey } from "../lib/cart-line";
import { SupportDesk } from "./support-desk";
import { CustomerHandoff, DriverHandoff } from "./delivery-handoff";
import { DriverApplication } from "./driver-onboarding";
import { CustomizedAdd, ModifierEditor } from "./menu-modifiers";
import { DriverAvailability, DriverLocationControl } from './delivery-tracking';
import { useEffect, useState, type FormEvent } from 'react';
import { unregisterPush } from '../lib/mobile';
import { useCommerce, CommerceBanner, OrderActions, CheckoutPanel, RestaurantAvailability } from './commerce-pages';
import { Link, Redirect, useLocation, useParams, useSearch } from 'wouter';
import { useAuth, useClerk } from '@clerk/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, ClipboardList, MapPin, Plus, RefreshCw, ShieldCheck, ShoppingBag, Utensils } from 'lucide-react';
import {
  getGetAdminFinanceQueryKey, getGetAdminOverviewQueryKey, getGetMyOrderQueryKey, getGetMyProfileQueryKey, getGetMyRestaurantQueryKey, getGetRestaurantQueryKey,
  getListAdminProfilesQueryKey, getListAdminRestaurantsQueryKey, getListMyAddressesQueryKey,
  getListMyOrdersQueryKey, getListRestaurantsQueryKey, useCreateMyOrder,
  useCreateMyRestaurant, useCreateMyRestaurantCategory, useCreateMyRestaurantMenuItem, useDeleteMyRestaurantCategory,
  useDeleteMyAddress, useDeleteMyRestaurantMenuItem, useGetAdminFinance, useGetAdminOverview, useGetMyOrder, useGetMyProfile, useGetMyRestaurant,
  useGetRestaurant, useHealthCheck, useListAdminProfiles, useListAdminRestaurants, useListMyAddresses, useListMyOrders,
  useUpdateMyAddress,
  useListRestaurants, useUpdateAdminProfile, useUpdateAdminRestaurantStatus, useUpdateMyRestaurant,
  useUpdateMyRestaurantCategory, useUpdateMyRestaurantMenuItem, useUpdateOrderStatus,
  type RestaurantInput, type Order, type OrderStatus,
} from '@workspace/api-client-react';

import { customFetch } from '../../../../lib/api-client-react/src/custom-fetch';

const money = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
const invalidate = (client: ReturnType<typeof useQueryClient>, ...keys: ReadonlyArray<readonly unknown[]>) => keys.forEach(queryKey => { void client.invalidateQueries({ queryKey }); });
const statusText = (s: string) => s.replaceAll('_', ' ');

function Logo() { return <Link className="roco-logo" href="/"><span className="roco-logo-mark"><Utensils size={18} /></span><span>RoCoEats</span></Link>; }
function Shell({ children }: { children: React.ReactNode }) {
  const { isSignedIn, userId } = useAuth(); const { signOut } = useClerk();
  const profile = useMyProfile();
  const role = profile.data?.role;
  return <div className="roco-page"><header className="roco-header roco-wrap"><Logo/><nav className="roco-nav" aria-label="Main navigation">
    <Link href="/restaurants">Find food</Link>{isSignedIn && <><Link href="/dashboard">Dashboard</Link><Link href="/orders">Orders</Link>{role === 'restaurant' && <Link href="/restaurant">Restaurant</Link>}{['admin','driver'].includes(role??'') && <Link href="/driver">Driver</Link>}<Link href="/account">Account</Link>{role === 'admin' && <><Link href="/admin">Administrator</Link><Link href="/operations">Dispatch &amp; orders</Link></>}<button onClick={async () => { if(userId)dutyIntent.set(userId,false); await customFetch('/api/driver/availability',{method:'PUT',body:JSON.stringify({available:false})}).catch(()=>{}); await unregisterPush().catch(()=>{}); await signOut({ redirectUrl: '/' }); }}>Sign out</button></>}
    {!isSignedIn && <><Link href="/cart">Continue as Guest</Link><Link href="/guest/order">Guest order</Link><Link href="/sign-in">Sign in</Link><Link href="/sign-up">Create account</Link><Link href="/sign-up?join=restaurant">Partner With RoCoEats</Link><Link href="/sign-up?join=driver">Drive With RoCoEats</Link></>}
  </nav></header><CommerceBanner/>{children}</div>;
}
function PageIntro({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return <><div className="roco-kicker">{eyebrow}</div><h1 className="roco-title">{title}</h1>{children && <p className="roco-subtitle">{children}</p>}</>;
}
function Loading({ label = 'Loading records' }: { label?: string }) { return <div className="roco-main" role="status" aria-label={label}><div className="portal-skeleton portal-loading-block" style={{ width: 170 }}/><div className="portal-skeleton portal-loading-block" style={{ width: 'min(520px,90%)', height: 52 }}/><div className="roco-grid">{[1,2,3].map(i => <div className="roco-card" key={i}><div className="portal-skeleton portal-loading-block"/><div className="portal-skeleton portal-loading-block" style={{ height: 90 }}/></div>)}</div></div>; }
function LoadError({ retry, message = 'We could not load this information.' }: { retry: () => void; message?: string }) { return <div className="roco-alert" role="alert">{message}<button className="roco-button" style={{ marginLeft: 12 }} onClick={retry}><RefreshCw size={14}/> Retry</button></div>; }
function useMyProfile() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  return useGetMyProfile({ query: { queryKey: [...getGetMyProfileQueryKey(), userId], enabled: !!isLoaded && !!isSignedIn, networkMode: 'always', retry: false, retryOnMount: false } });
}
function RoleGate({ allowed }: { allowed: string[] }) {
  const profile = useMyProfile();
  if (profile.isLoading) return <Loading label="Checking account permissions"/>;
  if (profile.isError) return <Shell><main className="roco-main"><LoadError retry={() => void profile.refetch()} message="Sign in and complete your profile to continue."/><p><Link href="/account/setup">Complete profile setup</Link> · <Link href="/account/access">Check account access</Link></p></main></Shell>;
  if (!profile.data || !allowed.includes(profile.data.role)) return <Shell><main className="roco-main"><PageIntro eyebrow="Permission required" title="This area is not part of your role."/><div className="roco-alert">Your account does not have an allowed role. Contact an administrator if you need different access.</div></main></Shell>;
  return null;
}

export function DiscoveryPage() {
  const [search, setSearch] = useState('');
  const directory = useListRestaurants({ search: search || undefined });
  const health = useHealthCheck({ query: { queryKey: ['/api/healthz'], staleTime: 60_000, retry: false } });
  const restaurants = directory.data || [];
  return <Shell><main className="roco-main"><div className="roco-kicker">Roane County · Tennessee</div><h1 className="roco-title">Local food,<br/>right around here.</h1><p className="roco-subtitle">Find approved restaurants serving our community. Only listings currently approved by RoCoEats appear here.</p>
    <div className="roco-toolbar"><label className="roco-field" style={{ maxWidth: 430 }}>Search approved restaurants<input className="roco-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Restaurant name"/></label><div className="roco-meta"><MapPin size={13} style={{ verticalAlign: 'middle' }}/> Roane County, TN <span style={{ marginLeft: 13 }}>API {health.isLoading ? 'checking' : health.isError ? 'unavailable' : health.data?.status || 'available'}</span></div></div>
    {directory.isLoading ? <div className="roco-grid">{[1,2,3].map(i => <div className="roco-card" key={i}><div className="portal-skeleton portal-loading-block"/><div className="portal-skeleton portal-loading-block" style={{ height: 80 }}/></div>)}</div> : directory.isError ? <LoadError retry={() => void directory.refetch()} message="Restaurant listings are unavailable right now."/> : restaurants.length ? <div className="roco-grid">{restaurants.map(r => <article className="roco-card roco-restaurant-card" key={r.id}><div><div className="roco-meta">Approved local restaurant</div><h2 style={{ marginTop: 14 }}>{r.name}</h2><p>{r.description || 'A local restaurant in Roane County.'}</p></div><div className="roco-row"><span className="roco-meta">{r.city}, {r.region}</span><Link className="roco-button primary" href={`/restaurants/${r.id}`}>View menu <ArrowRight size={14}/></Link></div></article>)}</div> : <div className="roco-empty"><div className="roco-kicker">The table is getting ready</div><h2>No approved restaurants yet</h2><p>There are no approved restaurants to show{search ? ` for “${search}”` : ''}. We will list businesses here when they complete review. No listings or activity have been added for demonstration.</p></div>}
    <div className="roco-notice" style={{ marginTop: 30 }}>RoCoEats ordering is in development. Restaurant discovery reflects approved records, but delivery service and payment processing are not represented as active.</div>
  </main></Shell>;
}
export function RestaurantMenuPage() {
  const { restaurantId = '' } = useParams<{ restaurantId: string }>();
  const {isLoaded,userId}=useAuth();
  const menu = useGetRestaurant(restaurantId, { query: { queryKey: getGetRestaurantQueryKey(restaurantId), enabled: !!restaurantId } });
  const [cart, setCart, cartWarning] = useCustomerCart();
  const add = (item: { id: string; name: string; priceCents: number }, modifiers:Record<string,string[]>={},extra=0,customization="",specialInstructions="") => {
    if (!isLoaded) return;
    if (cart.some(i => i.restaurantId !== restaurantId)) { window.alert('Your cart can include items from one restaurant at a time. Clear the cart before switching restaurants.'); return; }
    const lineId=cartLineKey(item.id,modifiers,specialInstructions);
    setCart(old=>old.some(i=>i.lineId===lineId)?old.map(i=>i.lineId===lineId?{...i,quantity:i.quantity+1}:i):[...old,{lineId,modifiers,customization,specialInstructions,menuItemId:item.id,name:item.name,priceCents:item.priceCents+extra,quantity:1,restaurantId,restaurantName:menu.data?.name||''}]);
  };
  if (menu.isLoading) return <Shell><Loading label="Loading restaurant menu"/></Shell>;
  if (menu.isError || !menu.data) return <Shell><main className="roco-main"><LoadError retry={() => void menu.refetch()} message="This approved restaurant menu could not be found."/></main></Shell>;
  return <Shell><main className="roco-main"><PageIntro eyebrow={`${menu.data.city}, ${menu.data.region} · approved restaurant`} title={menu.data.name}>{menu.data.description || 'Browse the current menu from this Roane County restaurant.'}</PageIntro>
    <div className="roco-toolbar">{cartWarning&&<p role="alert">{cartWarning}</p>}<div className="roco-meta">{menu.data.street1} · {menu.data.city}, {menu.data.region} {menu.data.postalCode}</div><Link className="roco-button primary" href="/cart"><ShoppingBag size={15}/> Cart ({cart.reduce((n, i) => n + i.quantity, 0)})</Link></div>
    <RestaurantStatus restaurantId={restaurantId}/>
    {menu.data.categories.length ? <div className="roco-two-col"><section className="roco-list">{menu.data.categories.map(cat => <div className="roco-card" key={cat.id}><div className="roco-row"><h2>{cat.name}</h2><span className="roco-meta">Menu section</span></div>{cat.items.length ? cat.items.map(item => <div className="roco-menu-item" key={item.id}><div><strong>{item.name}</strong><p style={{ margin: '5px 0 0' }}>{item.description}</p>{!item.isAvailable && <span className="roco-meta">Currently unavailable</span>}</div><div style={{ display: 'grid', gap: 10, justifyItems: 'end' }}><span className="roco-price">{money(item.priceCents)}</span>{item.isAvailable && <CustomizedAdd key={`${item.id}:${userId}`} item={item} disabled={!isLoaded} quantityInCart={cart.filter(line => line.menuItemId === item.id).reduce((count, line) => count + line.quantity, 0)} onAdd={(selected,extra,label,instructions)=>add(item,selected,extra,label,instructions)}/>}</div></div>) : <p>No menu items listed in this section.</p>}</div>)}</section><aside className="roco-card"><div className="roco-kicker">Ordering status</div><h2 style={{ marginTop: 13 }}>Development checkout</h2><p>Submitting an order saves an order record using server-verified totals. It does not charge money. Payments and delivery are not active services.</p><div className="roco-rule"/><Link className="roco-button primary" href="/cart">Review your cart <ArrowRight size={14}/></Link></aside></div> : <div className="roco-empty"><h2>Menu not published yet</h2><p>This approved restaurant has not added menu categories yet.</p></div>}
  </main></Shell>;
}

export function CartPage() {
  const {isLoaded,isSignedIn,userId}=useAuth();
  const guestToken = useGuestToken();
  const principal = isSignedIn ? userId : guestToken;
  const restore = new URLSearchParams(useSearch()).get('restore') === '1';
  const [guestCart, clearGuestCart] = useCartForOwner(null);
  const [, navigate] = useLocation();
  const client = useQueryClient();
  const commerce=useCommerce();
  const [cart, setCart, cartWarning] = useCustomerCart();
  useEffect(() => {
    if (!isSignedIn || !restore) return;
    if (!cart.length && guestCart.length) {
      setCart(guestCart);
      // Keep the guest copy if browser storage could not persist the transfer.
      try {
        const saved = window.localStorage.getItem(`rocoeats-cart:v2:${userId}`);
        if (saved === JSON.stringify(guestCart)) clearGuestCart([]);
      } catch {}
    }
    navigate('/cart', { replace: true });
  }, [isSignedIn, restore, guestCart, cart.length, setCart, clearGuestCart, navigate, userId]);
  const [addressId, setAddressId] = useState('');
  const [tipCents, setTipCents] = useState(0); const [placed, setPlaced] = useState<Order | null>(null);
  type Quote = {subtotalCents:number;deliveryFeeCents:number;serviceFeeCents:number;taxCents:number;tipCents:number;totalCents:number};
  const addressKey = [...getListMyAddressesQueryKey(), isSignedIn ? 'customer' : 'guest', principal];
  const addresses = useListMyAddresses({ query: { queryKey: addressKey, enabled: !!isLoaded && !!principal, retry: false, networkMode: 'always' } });
  const selectedAddressId = !addresses.isError && addresses.data?.some(address => address.id === addressId) ? addressId : '';
  useEffect(() => {
    if (!addresses.data || addresses.isError) return;
    if (!addresses.data.some(address => address.id === addressId)) {
      setAddressId(addresses.data.find(address => address.isDefault)?.id ?? (addresses.data.length === 1 ? addresses.data[0].id : ''));
    }
  }, [addresses.data, addresses.isError, addressId]);
  const inputFor = (items: typeof cart) => ({
    restaurantId: items[0]?.restaurantId, addressId: selectedAddressId, tipCents,
    items: items.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity, modifiers: i.modifiers ?? {}, specialInstructions: i.specialInstructions })),
  });
  const input = inputFor(cart);
  type Review = { input: typeof input; quote: Quote; key: string };
  const quote = useMutation({
    mutationFn: async ({ snapshot, previous }: { snapshot: typeof input; previous?: Review }): Promise<Review> => {
      const quote = await customFetch<Quote>('/api/orders/quote', { method: 'POST', body: JSON.stringify(snapshot) });
      return { input: snapshot, quote, key: previous?.quote.totalCents === quote.totalCents ? previous.key : crypto.randomUUID() };
    },
  });
  const review = quote.data && JSON.stringify(quote.data.input) === JSON.stringify(input) ? quote.data : undefined;
  const order = useMutation({
    mutationFn: (reviewed: Review) => customFetch<Order>('/api/orders', {
      method: 'POST',
      headers: { 'Idempotency-Key': reviewed.key },
      body: JSON.stringify({ ...reviewed.input, expectedTotalCents: reviewed.quote.totalCents }),
    }),
    onSuccess: (result, reviewed) => {
      setPlaced(result);
      setCart(current => JSON.stringify(inputFor(current).items) === JSON.stringify(reviewed.input.items) &&
        current[0]?.restaurantId === reviewed.input.restaurantId ? [] : current);
      invalidate(client, getListMyOrdersQueryKey());
    },
  });
  const changeQuantity = (lineId: string, change: number) => setCart(current => current.flatMap(line => {
    if (line.lineId !== lineId) return [line];
    const quantity = line.quantity + change;
    return quantity > 0 ? [{ ...line, quantity }] : [];
  }));
  const totals=(q:Quote)=><dl>{([['Food',q.subtotalCents],['Delivery',q.deliveryFeeCents],['Service',q.serviceFeeCents],['Illustrative test tax',q.taxCents],['Tip',q.tipCents],['Total',q.totalCents]] as const).map(([label,value])=><div className="roco-row" key={label}><dt>{label}</dt><dd>{money(value)}</dd></div>)}</dl>;
  return <Shell><main className="roco-main roco-checkout"><PageIntro eyebrow="Customer · test checkout" title={placed?'Order saved. Complete test payment.':'Review your delivery.'}>All checkout and settlement activity is test mode. Live charges are disabled.</PageIntro>
    {!commerce.data?.orderingEnabled&&<p className="roco-notice">Ordering is not open yet. You can browse menus and review a quote.</p>}{cartWarning&&<p role="alert">{cartWarning}</p>}{placed?<section className="roco-card">{totals(placed)}<RestaurantConfirmation orderId={placed.id}/><CheckoutPanel orderId={placed.id}/><Link href={!isSignedIn&&readGuestToken()?"/guest/order":"/orders"} className="roco-button">Track order</Link></section>:<div className="roco-two-col"><section className="roco-card"><h2>Your items</h2>{cart.length?cart.map(i=><div className="roco-menu-item roco-cart-item" key={i.lineId}><div><strong>{i.name}</strong><p>{i.customization}</p><p>{i.specialInstructions}</p><p>{i.restaurantName} · {money(i.priceCents*i.quantity)}</p></div><div><button className="roco-button" aria-label={`Remove one ${i.name}`} onClick={()=>changeQuantity(i.lineId!, -1)}>−</button> {i.quantity} <button className="roco-button" aria-label={`Add one ${i.name}`} disabled={i.quantity >= 50} onClick={()=>changeQuantity(i.lineId!, 1)}>+</button></div></div>):<p>Your cart is empty. <Link href="/restaurants">Find food</Link></p>}</section>
      <section className="roco-card"><h2>Delivery address</h2><CheckoutAddresses key={principal} addresses={addresses.data} pending={addresses.isPending} error={addresses.error} retry={()=>void addresses.refetch()} selectedId={selectedAddressId} onSelect={setAddressId} queryKey={addressKey} guest={!isSignedIn}/>
      <label className="roco-field">Driver tip (dollars)<input className="roco-input" type="number" min="0" max="1000" step="0.01" value={(tipCents/100).toString()} onChange={e=>setTipCents(Math.round(Number(e.target.value)*100))}/></label>
      <button className="roco-button" disabled={!cart.length||!selectedAddressId||quote.isPending||order.isPending} onClick={()=>quote.mutate({ snapshot: input, previous: review })}>Calculate test total</button>
      {review&&<>{totals(review.quote)}<button className="roco-button primary" disabled={!commerce.data?.orderingEnabled||order.isPending||quote.isPending} onClick={()=>order.mutate(review)}>Create order · {money(review.quote.totalCents)}</button></>}
      {quote.isError&&<p role="alert" className="roco-alert">{quote.error.message}</p>}{order.isError&&<p role="alert" className="roco-alert">{order.error.message}</p>}</section></div>}
  </main></Shell>;
}

export function OrdersPage() {
  const orders = useListMyOrders({ query: { queryKey: getListMyOrdersQueryKey(), refetchOnMount: 'always', refetchInterval:10000 } });
  return <Shell><main className="roco-main"><PageIntro eyebrow="Customer account" title="Your order history.">Statuses and totals are read from saved test orders.</PageIntro><p><a href="rocoeats://orders">Return to mobile app</a></p>{orders.isLoading ? <Loading/> : orders.isError ? <LoadError retry={() => void orders.refetch()} message="Your order history could not be loaded. Sign in with a customer profile to continue."/> : orders.data?.length ? <div className="roco-list" style={{ marginTop: 25 }}>{orders.data.map(o => <article className="roco-card" key={o.id}><div className="roco-row"><div><div className="roco-meta">{new Date(o.placedAt).toLocaleString()}</div><h2 style={{ marginTop: 9 }}>{o.restaurantName}</h2></div><span className={`roco-badge ${o.status === 'delivered' ? 'delivered' : ''}`}>{statusText(o.status)}</span></div><div className="roco-row"><span>{o.items.map(i => `${i.quantity} × ${i.itemName}${i.modifierSnapshot?.length ? " ("+i.modifierSnapshot.map(m=>m.option).join(", ")+")" : ""}`).join(' · ')}</span><strong>{money(o.totalCents)}</strong></div><div className="roco-rule"/><div className="roco-meta">Payment {statusText(o.paymentStatus)} · {o.paymentCollected ? 'collected' : 'not collected'}</div><OrderActions order={o}/>{["out_for_delivery","delivered"].includes(o.status)&&<CustomerHandoff orderId={o.id} delivered={o.status==="delivered"}/>}</article>)}</div> : <div className="roco-empty" style={{ marginTop: 25 }}><ClipboardList size={25} color="#efbd68"/><h2>No orders recorded</h2><p>Your order history will appear here after a development checkout creates a server-side order record.</p></div>}</main></Shell>;
}

function RestaurantOnboarding() {
  const create = useCreateMyRestaurant(); const client = useQueryClient();
  const submit = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const f = new FormData(e.currentTarget); const data: RestaurantInput = { name: String(f.get('name')), description: String(f.get('description') || ''), phone: String(f.get('phone') || ''), street1: String(f.get('street1')), street2: String(f.get('street2') || ''), city: String(f.get('city')), region: String(f.get('region') || 'TN'), postalCode: String(f.get('postalCode')) }; create.mutate({ data }, { onSuccess: () => invalidate(client, getGetMyRestaurantQueryKey()) }); };
  return <section className="roco-card"><div className="roco-kicker">Restaurant partner</div><h2 style={{ marginTop: 12 }}>Submit your business for review</h2><p>Submitting a profile does not publish a listing. An administrator must approve it before it appears in discovery.</p><form className="roco-form-grid" onSubmit={submit}><label className="roco-field">Business name<input required minLength={2} name="name" className="roco-input"/></label><label className="roco-field">Phone<input name="phone" className="roco-input"/></label><label className="roco-field full">Description<textarea name="description" className="roco-textarea"/></label><label className="roco-field full">Street address<input required name="street1" className="roco-input"/></label><label className="roco-field">Address line 2<input name="street2" className="roco-input"/></label><label className="roco-field">City<input required name="city" className="roco-input"/></label><label className="roco-field">State<input name="region" defaultValue="TN" className="roco-input"/></label><label className="roco-field">ZIP code<input required name="postalCode" className="roco-input"/></label><button disabled={create.isPending} className="roco-button primary">{create.isPending ? 'Submitting…' : 'Submit for review'}</button></form>{create.isError && <div className="roco-alert" style={{ marginTop: 12 }}>Business profile submission failed. Check required details and account permissions.</div>}</section>;
}
export function RestaurantPage() {
  const profile = useMyProfile(); const client = useQueryClient(); const mine = useGetMyRestaurant({ query: { queryKey: getGetMyRestaurantQueryKey(), networkMode: 'always', enabled: profile.data?.role === 'restaurant', retry: false, refetchOnMount: 'always' } });
  const [section, setSection] = useState<'profile'|'menu'|'incoming'>('profile');
  const update = useUpdateMyRestaurant(); const newCat = useCreateMyRestaurantCategory(); const editCat = useUpdateMyRestaurantCategory(); const removeCat = useDeleteMyRestaurantCategory(); const newItem = useCreateMyRestaurantMenuItem(); const editItem = useUpdateMyRestaurantMenuItem(); const removeItem = useDeleteMyRestaurantMenuItem(); const status = useUpdateOrderStatus();
  const orders = useListMyOrders({ query: { queryKey: getListMyOrdersQueryKey(), enabled: profile.data?.role === 'restaurant', retry: false, refetchOnMount: 'always', refetchInterval:10000 } });
  const reload = () => { invalidate(client, getGetMyRestaurantQueryKey(), getListMyOrdersQueryKey()); };
  if (profile.isLoading || (profile.data?.role === 'restaurant' && mine.isLoading)) return <Shell><Loading/></Shell>;
  if (profile.isError && accountStatus(profile.error) === 404) return <Redirect to="/account/setup?join=restaurant" />;
  if (profile.isError) return <Shell><main className="roco-main"><PageIntro eyebrow="Restaurant access" title="We couldn’t open your workspace."/><LoadError retry={() => void profile.refetch()} message={accountStatus(profile.error) === 403 ? "This account does not have restaurant workspace access. Private staging requires an invitation." : "Check your connection or sign in again."}/><p><Link href="/account/access?join=restaurant">Check account access</Link> · <Link href="/sign-in?join=restaurant">Sign in again</Link></p></main></Shell>;
  if (profile.data?.role !== 'restaurant') return <Shell><main className="roco-main"><PageIntro eyebrow="Restaurant access" title="Your restaurant workspace.">Sign in with your restaurant partner account.</PageIntro><Link href="/account/access?join=restaurant">Check account access</Link></main></Shell>;
  if (mine.isError && (mine.error as {status?: number})?.status === 404) return <Shell><main className="roco-main"><PageIntro eyebrow="Restaurant onboarding" title="Bring your business to the table."/> <RestaurantOnboarding/></main></Shell>;
  if (mine.isError) return <Shell><main className="roco-main"><LoadError retry={() => void mine.refetch()} message="Your restaurant profile is unavailable or this role is not permitted."/></main></Shell>;
  const restaurant = mine.data;
  if (!restaurant) return <Shell><Loading label="Loading your restaurant profile"/></Shell>;
  const promptItem = (categoryId: string) => { const name = window.prompt('Menu item name'); if (!name?.trim()) return; const price = window.prompt('Price in dollars'); if (price === null || !Number.isFinite(Number(price))) return; newItem.mutate({ data: { categoryId, name: name.trim(), priceCents: Math.round(Number(price) * 100), isAvailable: true } }, { onSuccess: reload }); };
  return <Shell><main className="roco-main"><PageIntro eyebrow="Restaurant workspace" title={restaurant.name}>Manage your submitted business profile, menu, and incoming orders. Review status is controlled by operations.</PageIntro><div className="roco-row" style={{ marginTop: 20 }}><span className={`roco-badge ${restaurant.status}`}>{restaurant.status} review status</span><span className="roco-meta">Owner-only workspace</span></div>
    {status.isError && <p className="roco-alert" role="alert">{status.error.message}</p>}
    <div className="roco-tabs" role="tablist">{(['profile','menu','incoming'] as const).map(s => <button key={s} role="tab" aria-selected={section===s} onClick={() => setSection(s)}>{s === 'incoming' ? 'Incoming orders' : s === 'menu' ? 'Menu management' : 'Business profile'}</button>)}</div>
    {section === 'profile' && <RestaurantAvailability/>}
    {section === 'profile' && <section className="roco-card"><h2>Business profile</h2><p>Updates are saved to your owner profile. Address and contact details are managed through the existing profile endpoint.</p><form className="roco-form-grid" onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); update.mutate({ data: { name: String(f.get('name')), description: String(f.get('description')), phone: String(f.get('phone')), street1: String(f.get('street1')), street2: String(f.get('street2')), city: String(f.get('city')), region: String(f.get('region')), postalCode: String(f.get('postalCode')) } }, { onSuccess: reload }); }}><label className="roco-field">Name<input name="name" defaultValue={restaurant.name} className="roco-input"/></label><label className="roco-field">Phone<input name="phone" defaultValue={restaurant.phone || ''} className="roco-input"/></label><label className="roco-field full">Description<textarea name="description" defaultValue={restaurant.description || ''} className="roco-textarea"/></label><label className="roco-field full">Street<input name="street1" defaultValue={restaurant.street1} className="roco-input"/></label><label className="roco-field">Street 2<input name="street2" defaultValue={restaurant.street2 || ''} className="roco-input"/></label><label className="roco-field">City<input name="city" defaultValue={restaurant.city} className="roco-input"/></label><label className="roco-field">Region<input name="region" defaultValue={restaurant.region} className="roco-input"/></label><label className="roco-field">Postal code<input name="postalCode" defaultValue={restaurant.postalCode} className="roco-input"/></label><button className="roco-button primary" disabled={update.isPending}>Save profile</button></form>{update.isError && <p className="roco-alert">Profile update was not accepted.</p>}</section>}
    {section === 'menu' && <RestaurantInventory/>}
    {section === 'menu' && <div className="roco-list"><div className="roco-row"><h2>Menu categories</h2><button className="roco-button primary" onClick={() => { const name = window.prompt('Category name'); if (name?.trim()) newCat.mutate({ data: { name: name.trim(), sortOrder: restaurant.categories.length } }, { onSuccess: reload }); }}><Plus size={14}/> Add category</button></div>{restaurant.categories.length ? restaurant.categories.map(cat => <section className="roco-card" key={cat.id}><div className="roco-row"><h2>{cat.name}</h2><div className="roco-row"><button className="roco-button" onClick={() => { const name = window.prompt('Rename category', cat.name); if (name?.trim()) editCat.mutate({ categoryId: cat.id, data: { name: name.trim() } }, { onSuccess: reload }); }}>Rename</button><button className="roco-button danger" onClick={() => { if (cat.items.length) { window.alert('Remove its menu items before deleting this category.'); return; } if (window.confirm(`Delete ${cat.name}?`)) removeCat.mutate({ categoryId: cat.id }, { onSuccess: reload }); }}>Delete</button><button className="roco-button primary" onClick={() => promptItem(cat.id)}><Plus size={13}/> Add item</button></div></div>{cat.items.map(it => <div className="roco-menu-item" key={it.id}><div><strong>{it.name}</strong><ModifierEditor itemId={it.id} groups={it.modifierGroups} reload={reload}/><p>{it.description || 'No description'}</p><span className="roco-price">{money(it.priceCents)}</span></div><div className="roco-row"><button className="roco-button" onClick={() => editItem.mutate({ menuItemId: it.id, data: { isAvailable: !it.isAvailable } }, { onSuccess: reload })}>{it.isAvailable ? 'Hide' : 'Show'}</button><button className="roco-button" onClick={() => { const name = window.prompt('Item name', it.name); if (!name?.trim()) return; const amount = window.prompt('Price in dollars', (it.priceCents / 100).toFixed(2)); if (amount !== null && Number.isFinite(Number(amount))) editItem.mutate({ menuItemId: it.id, data: { name: name.trim(), priceCents: Math.round(Number(amount) * 100) } }, { onSuccess: reload }); }}>Edit</button><button className="roco-button danger" onClick={() => { if (window.confirm(`Remove ${it.name} from this menu?`)) removeItem.mutate({ menuItemId: it.id }, { onSuccess: reload }); }}>Remove</button></div></div>)}</section>) : <div className="roco-empty"><h2>No menu categories</h2><p>Add a category before listing menu items.</p></div>}</div>}
    {section === 'incoming' && (orders.isLoading ? <Loading/> : orders.isError ? <LoadError retry={() => void orders.refetch()} message="Incoming orders are unavailable for this account."/> : orders.data?.length ? <div className="roco-list">{orders.data.filter(o => o.restaurantId === restaurant.id).map(o => <OrderControls key={o.id} order={o} onStatus={(next) => status.mutate({ orderId: o.id, data: { status: next } }, { onSuccess: reload })}/>)}</div> : <div className="roco-empty"><h2>No incoming orders</h2><p>There are no server-visible order records for this restaurant.</p></div>)}
  </main></Shell>;
}
function OrderControls({ order, onStatus }: { order: Order; onStatus: (status: OrderStatus) => void }) {
  const next: Partial<Record<OrderStatus, OrderStatus>> = { placed: 'accepted', restaurant_received: 'accepted', pending: 'accepted', accepted: 'preparing', preparing: 'ready_for_pickup' };
  return <article className="roco-card"><SupportDesk orderId={order.id}/><div className="roco-row"><div><div className="roco-meta">{new Date(order.placedAt).toLocaleString()} · {order.customerName}</div><h2 style={{ marginTop: 7 }}>Order {order.id.slice(0, 8)}</h2></div><span className="roco-badge">{statusText(order.status)}</span></div>{order.items.map(i => <p key={i.id}>{i.quantity} × {i.itemName}{i.specialInstructions&&<em> · {i.specialInstructions}</em>}{i.modifierSnapshot?.map((m,index)=><span key={index}> · {m.group}: {m.option}</span>)}</p>)}<div className="roco-row"><span>{money(order.totalCents)} · test payment {statusText(order.paymentStatus)}</span>{!['cancelled','out_for_delivery','delivered'].includes(order.status) && <button className="roco-button danger" onClick={() => { if(window.confirm('Cancel this test order and refund its payment?')) onStatus('cancelled'); }}>Cancel / refund</button>}{order.paymentCollected && next[order.status] && <button className="roco-button primary" onClick={() => onStatus(next[order.status]!)}>Mark {statusText(next[order.status]!)}</button>}</div></article>;
}

export function AdminPage() {
  const profile = useMyProfile(); const client = useQueryClient(); const [tab,setTab] = useState<'overview'|'restaurants'|'accounts'|'finance'>('overview');
  const overview = useGetAdminOverview({ query: { queryKey: getGetAdminOverviewQueryKey(), enabled: profile.data?.role === 'admin', retry: false } });
  const restaurants = useListAdminRestaurants({ query: { queryKey: getListAdminRestaurantsQueryKey(), enabled: profile.data?.role === 'admin', retry: false } });
  const profiles = useListAdminProfiles({ query: { queryKey: getListAdminProfilesQueryKey(), enabled: profile.data?.role === 'admin', retry: false } });
  const finance = useGetAdminFinance({ query: { queryKey: getGetAdminFinanceQueryKey(), enabled: profile.data?.role === 'admin', retry: false } });
  const changeRestaurant = useUpdateAdminRestaurantStatus(); const changeProfile = useUpdateAdminProfile();
  if (profile.isLoading) return <Shell><Loading label="Checking operations access"/></Shell>;
  if (profile.isError || profile.data?.role !== 'admin') return <Shell><main className="roco-main"><PageIntro eyebrow="Restricted operations" title="Administrator access only."/><div className="roco-alert">This view requires an active admin profile. <Link href="/account/access">Check owner access and configuration</Link> or <Link href="/account/setup">complete profile setup</Link>.</div></main></Shell>;
  const refresh = () => invalidate(client, getGetAdminOverviewQueryKey(), getListAdminRestaurantsQueryKey(), getListAdminProfilesQueryKey(), getGetAdminFinanceQueryKey());
  const changeStatus = (id: string, status: 'approved'|'rejected'|'suspended') => changeRestaurant.mutate({ restaurantId: id, data: { status } }, { onSuccess: refresh });
  const stat = (label: string, value: number | string) => <div className="roco-stat" key={label}><span>{label}</span><strong>{value}</strong></div>;
  return <Shell><main className="roco-main"><PageIntro eyebrow="Protected operations · administrator" title="The county operations desk.">Server-backed oversight of restaurant review, member accounts, order counts, and finance summaries. Actions require administrator permissions.</PageIntro>
    <div className="roco-tabs" role="tablist">{(['overview','restaurants','accounts','finance'] as const).map(t => <button role="tab" aria-selected={tab===t} key={t} onClick={() => setTab(t)}>{t}</button>)}</div>
    {tab === 'overview' && (overview.isLoading ? <Loading/> : overview.isError ? <LoadError retry={() => void overview.refetch()} message="Admin overview is restricted or unavailable."/> : overview.data && <><div className="roco-stats">{stat('Profiles',overview.data.totalProfiles)}{stat('Customers',overview.data.totalCustomers)}{stat('Restaurants',overview.data.totalRestaurants)}{stat('Pending review',overview.data.pendingRestaurants)}{stat('Approved',overview.data.approvedRestaurants)}{stat('Suspended',overview.data.suspendedRestaurants)}{stat('Orders',overview.data.totalOrders)}{stat('Active orders',overview.data.activeOrders)}{stat('Completed',overview.data.completedOrders)}{stat('Pending payments',overview.data.pendingPayments)}</div><div className="roco-notice">Overview counts are server-provided. Open Order operations to manage orders, refunds, settlements, driver approvals, and test pricing.</div></>)}
    {tab === 'restaurants' && (restaurants.isLoading ? <Loading/> : restaurants.isError ? <LoadError retry={() => void restaurants.refetch()} message="Restaurant review records could not be loaded."/> : restaurants.data?.length ? <div className="roco-table-wrap"><table className="roco-table"><thead><tr><th>Restaurant</th><th>Owner</th><th>Location</th><th>Review</th><th>Decision</th></tr></thead><tbody>{restaurants.data.map(r => <tr key={r.id}><td><strong>{r.name}</strong><div className="roco-meta">{r.id}</div></td><td>{r.ownerName}</td><td>{r.city}, {r.region}</td><td><span className={`roco-badge ${r.status}`}>{r.status}</span></td><td><div className="roco-row">{(['approved','rejected','suspended'] as const).map(s => <button key={s} className="roco-button" onClick={() => changeStatus(r.id,s)}>{s}</button>)}</div></td></tr>)}</tbody></table></div> : <div className="roco-empty"><h2>No restaurant profiles to review</h2><p>Submissions will appear here when businesses create a profile.</p></div>)}
    {tab === 'accounts' && (profiles.isLoading ? <Loading/> : profiles.isError ? <LoadError retry={() => void profiles.refetch()} message="Account records could not be loaded."/> : profiles.data?.length ? <div className="roco-table-wrap"><table className="roco-table"><thead><tr><th>Member</th><th>Role</th><th>Activation</th><th>Actions</th></tr></thead><tbody>{profiles.data.map(p => <tr key={p.id}><td>{p.displayName}<div className="roco-meta">{p.id}</div></td><td><select className="roco-select" value={p.role} onChange={e => changeProfile.mutate({ profileId:p.id,data:{ role:e.target.value as 'customer'|'restaurant'|'driver' } },{onSuccess:refresh})}><option value="customer">Customer</option><option value="restaurant">Restaurant</option><option value="driver">Driver</option><option value="admin" disabled>Administrator</option></select></td><td><span className={`roco-badge ${p.isActive?'approved':'pending'}`}>{p.isActive?'active':'inactive'}</span></td><td><button className="roco-button" onClick={() => changeProfile.mutate({ profileId:p.id,data:{isActive:!p.isActive} },{onSuccess:refresh})}>{p.isActive?'Deactivate':'Activate'}</button></td></tr>)}</tbody></table></div> : <div className="roco-empty"><h2>No profiles found</h2><p>There are no member profiles in the operations record.</p></div>)}
    {tab === 'finance' && (finance.isLoading ? <Loading/> : finance.isError ? <LoadError retry={() => void finance.refetch()} message="Finance summaries are unavailable or restricted."/> : finance.data && <><div className="roco-row" style={{ marginBottom: 14 }}><h2>Payment provider</h2><span className="roco-badge">{finance.data.paymentProviderConnected?'connected':'not connected'}</span></div><div className="roco-stats">{stat('Succeeded payments',finance.data.succeededPaymentCount)}{stat('Succeeded volume',money(finance.data.succeededPaymentCents))}{stat('Pending payments',finance.data.pendingPaymentCount)}{stat('Pending volume',money(finance.data.pendingPaymentCents))}{stat('Refunded count',finance.data.refundedPaymentCount)}{stat('Refunded volume',money(finance.data.refundedPaymentCents))}{stat('Paid out',money(finance.data.paidOutCents))}{stat('Pending payout',money(finance.data.pendingPayoutCents))}{stat('Failed payouts',finance.data.failedPayoutCount)}</div><div className="roco-notice">Finance values are read-only summaries from the API. All amounts are test funds. Use Order operations for refunds and transfers to test connected balances.</div></>)}
    {tab==='accounts'&&<AdministratorAccessManager/>}
    <div className="roco-notice" style={{ marginTop: 24 }}><ShieldCheck size={14} style={{ verticalAlign:'middle',marginRight:8 }}/>Administrator operations are protected by server role checks. A failed request may indicate insufficient permission; no client-side role change grants admin access.</div>
  </main></Shell>;
}

type DriverDelivery = {
  arrivedAt?:string|null;
  orderId: string; status: string; orderStatus?: string; restaurantName: string;
  pickupStreet: string; pickupCity: string; pickupRegion?:string; pickupPostalCode?:string;
  deliveryAddress?: { street1: string; street2?: string | null; city: string; region: string; postalCode: string; deliveryInstructions?: string | null };
};
export function DriverPage() {
  const profile = useMyProfile();
  const client = useQueryClient();
  const enabled = ['driver','admin'].includes(profile.data?.role??'');
  const offers = useQuery({ queryKey: ['driver-offers'], queryFn: () => customFetch<DriverDelivery[]>('/api/driver/offers'), enabled, refetchInterval: 15000 });
  const deliveries = useQuery({ queryKey: ['driver-deliveries'], queryFn: () => customFetch<DriverDelivery[]>('/api/driver/deliveries'), enabled, refetchInterval: 15000 });
  const update = useMutation({
    mutationFn: ({ orderId, action }: { orderId: string; action: string }) => customFetch(`/api/driver/orders/${orderId}/${action}`, { method: 'POST' }),
    onSuccess: () => { void client.invalidateQueries({queryKey:['driver-declined-offers']}); void client.invalidateQueries({queryKey:['driver-availability']}); void client.invalidateQueries({ queryKey: ['driver-offers'] }); void client.invalidateQueries({ queryKey: ['driver-deliveries'] }); },
  });
  if (profile.isLoading) return <Shell><Loading label="Checking driver access"/></Shell>;
  if (profile.isError && accountStatus(profile.error) === 404) return <Redirect to="/account/setup?join=driver" />;
  if (profile.isError) return <Shell><main className="roco-main"><PageIntro eyebrow="Driver access" title="We couldn’t open your workspace."/><LoadError retry={() => void profile.refetch()} message={accountStatus(profile.error) === 403 ? "This account does not have driver workspace access. Private staging requires an invitation." : "Check your connection or sign in again."}/><p><Link href="/account/access?join=driver">Check account access</Link> · <Link href="/sign-in?join=driver">Sign in again</Link></p></main></Shell>;
  if (!enabled) return <Shell><main className="roco-main"><PageIntro eyebrow="Driver access" title="Your delivery workspace.">Sign in with an active, administrator-approved driver profile to view deliveries.</PageIntro><p><Link href="/account/access?join=driver">Check driver access</Link></p></main></Shell>;
  const card = (d: DriverDelivery, offer: boolean) => <article className="roco-card" key={d.orderId}>
    {d.status==='picked_up'&&d.orderStatus==='out_for_delivery'&&<DriverHandoff orderId={d.orderId} onCompleted={()=>{void client.invalidateQueries({queryKey:['driver-availability']});void client.invalidateQueries({queryKey:['driver-deliveries']});void client.invalidateQueries({queryKey:['driver-offers']});}}/>}
    {!offer&&<SupportDesk orderId={d.orderId}/>}<h3>{d.restaurantName}</h3><p>Pickup: {d.pickupStreet}, {d.pickupCity}</p><p className="roco-meta">Order {d.orderId} · {statusText(d.status)}</p>
    {d.deliveryAddress && <><p>Deliver to: {d.deliveryAddress.street1} {d.deliveryAddress.street2}, {d.deliveryAddress.city}, {d.deliveryAddress.region} {d.deliveryAddress.postalCode}</p><p>{d.deliveryAddress.deliveryInstructions}</p></>}
    <NavigationActions label="Navigate to Restaurant" address={{street1:d.pickupStreet,city:d.pickupCity,region:d.pickupRegion,postalCode:d.pickupPostalCode}}/>
    {!offer&&d.deliveryAddress&&<NavigationActions label="Navigate to Customer" address={d.deliveryAddress}/>}
    {!offer&&!["delivered","cancelled"].includes(d.status)&&<GuestDeliveryContact orderId={d.orderId}/>}

    {d.status==='assigned'&&(d.arrivedAt?<p role="status">Arrival reported at {new Date(d.arrivedAt).toLocaleTimeString()}</p>:<button className="roco-button" disabled={update.isPending} onClick={()=>update.mutate({orderId:d.orderId,action:'arrive'})}>I’m at the restaurant</button>)}
    {d.status==='assigned'&&<button className="roco-button" disabled={update.isPending} onClick={()=>{if(window.confirm('Release this delivery before pickup?'))update.mutate({orderId:d.orderId,action:'release'});}}>Release delivery</button>}
    {!offer&&['assigned','picked_up'].includes(d.status)&&<DriverLocationControl orderId={d.orderId}/>}
    {offer&&<button className="roco-button" disabled={update.isPending} onClick={()=>update.mutate({orderId:d.orderId,action:'decline-offer'})}>Decline for 15 min</button>}
    {(offer || (d.status === 'assigned' && d.orderStatus === 'ready_for_pickup')) && <button className="roco-button primary" disabled={update.isPending} onClick={() => update.mutate({ orderId: d.orderId, action: offer ? 'claim' : d.status === 'assigned' ? 'pickup' : 'deliver' })}>{offer ? 'Claim delivery' : d.status === 'assigned' ? 'Confirm pickup' : 'Confirm delivered'}</button>}
  </article>;
  return <Shell><main className="roco-main"><PageIntro eyebrow="Driver" title="Local deliveries.">Paid orders ready for pickup appear here. Customer addresses are available after you claim a delivery.</PageIntro>
    {update.isError && <p className="roco-alert" role="alert">{update.error.message}</p>}
    {profile.data?.role==='admin'&&<p className="roco-notice">Administrator delivery workspace · Your administrator access stays active. Delivery eligibility is verified by the server. <Link href="/admin">Return to owner dashboard</Link></p>}<DriverApplication/><SupportDesk/><DriverAvailability/><h2>My deliveries</h2>{deliveries.isPending ? <Loading/> : deliveries.isError ? <LoadError retry={() => void deliveries.refetch()} message={deliveries.error.message}/> : <div className="roco-list">{deliveries.data?.length ? deliveries.data.map(d => card(d, false)) : <p>No assigned deliveries.</p>}</div>}
    <h2>Available offers</h2>{offers.isPending ? <Loading/> : offers.isError ? <LoadError retry={() => void offers.refetch()} message={offers.error.message}/> : <div className="roco-list">{offers.data?.length ? offers.data.map(d => card(d, true)) : <p>No paid deliveries available right now.</p>}</div>}
    <DeclinedOffers/>
  </main></Shell>;
}
