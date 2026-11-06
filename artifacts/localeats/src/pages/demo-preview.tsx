import { useState } from "react";
import { CustomizedAdd } from "./menu-modifiers";
import "./demo-preview.css";
const money = (n: number) => `$${(n / 100).toFixed(2)}`;
const restaurants = [
  {
    id: "river",
    name: "Riverbend Kitchen",
    kind: "Southern comfort · Burgers",
    time: "25–35 min",
    emoji: "🍔",
    color: "#edcfaa",
  },
  {
    id: "ridge",
    name: "Ridgeway Pizza Co.",
    kind: "Pizza · Italian",
    time: "30–40 min",
    emoji: "🍕",
    color: "#d9e0c7",
  },
  {
    id: "garden",
    name: "The Garden Table",
    kind: "Fresh bowls · Sandwiches",
    time: "20–30 min",
    emoji: "🥗",
    color: "#d9dfe9",
  },
];
const groups = [
  {
    id: "side",
    name: "Choose your side",
    minSelections: 1,
    maxSelections: 1,
    options: [
      { id: "fries", name: "Seasoned fries", priceCents: 0 },
      { id: "salad", name: "House salad", priceCents: 200 },
    ],
  },
  {
    id: "extras",
    name: "Make it yours",
    minSelections: 0,
    maxSelections: 2,
    options: [
      { id: "cheese", name: "Extra cheddar", priceCents: 100 },
      { id: "bacon", name: "Smoked bacon", priceCents: 200 },
    ],
  },
];
const menu = [
  {
    id: "burger",
    name: "Riverbend Smash Burger",
    description: "Two seared patties, cheddar, pickles and house sauce.",
    priceCents: 1295,
    emoji: "🍔",
    modifierGroups: groups,
  },
  {
    id: "chicken",
    name: "Crispy Chicken Sandwich",
    description: "Golden chicken, slaw and a little Tennessee heat.",
    priceCents: 1195,
    emoji: "🥪",
    modifierGroups: groups,
  },
  {
    id: "brownie",
    name: "Warm Chocolate Brownie",
    description: "A rich chocolate finish to your meal.",
    priceCents: 495,
    emoji: "🍫",
    modifierGroups: [],
  },
];
type Line = {
  key: string;
  name: string;
  price: number;
  quantity: number;
  label: string;
};
type Order = {
  id: string;
  restaurant: string;
  lines: Line[];
  total: number;
  status: string;
  tip: number;
};
const stages = [
  "Placed",
  "Accepted",
  "Preparing",
  "Ready for pickup",
  "Out for delivery",
  "Delivered",
];
export default function DemoPreview() {
  const [role, setRole] = useState("Customer"),
    [page, setPage] = useState("Discover"),
    [chosen, setChosen] = useState(""),
    [cart, setCart] = useState<Line[]>([]),
    [orders, setOrders] = useState<Order[]>([]),
    [online, setOnline] = useState(false),
    [assigned, setAssigned] = useState(""),
    [tip, setTip] = useState(300),
    [address, setAddress] = useState("123 Demo Lane, Rockwood, TN 37854"),
    [message, setMessage] = useState(""),
    [itemNames, setItemNames] = useState(menu.map((x) => x.name)),
    [approved, setApproved] = useState(false),
    [fee, setFee] = useState(399),
    [profile, setProfile] = useState("Demo Neighbor");
  const nav =
    role === "Customer"
      ? ["Discover", "Cart", "Orders", "Profile"]
      : role === "Restaurant"
        ? ["Overview", "Menu", "Orders", "Earnings"]
        : role === "Driver"
          ? ["Overview", "Offers", "Active delivery", "Earnings"]
          : ["Overview", "Partners", "Orders", "Finances", "Settings"];
  const subtotal = cart.reduce((n, l) => n + l.price * l.quantity, 0),
    tax = Math.round(subtotal * 0.0975),
    service = Math.round(subtotal * 0.05),
    total = subtotal + tax + service + fee + tip;
  const update = (id: string, status: string) =>
    setOrders((os) => os.map((o) => (o.id === id ? { ...o, status } : o)));
  const switchRole = (r: string) => {
    setRole(r);
    setPage(r === "Customer" ? "Discover" : "Overview");
    setMessage("");
  };
  const card = (title: string, value: string, detail: string) => (
    <div className="roco-card">
      <div className="roco-meta">{title}</div>
      <h2>{value}</h2>
      <p>{detail}</p>
    </div>
  );
  const summary = (o: Order) => (
    <article className="roco-card" key={o.id}>
      <div className="roco-row">
        <strong>
          #{o.id} · {o.restaurant}
        </strong>
        <span className="roco-badge">{o.status}</span>
      </div>
      {o.lines.map((l) => (
        <p key={l.key}>
          {l.quantity} × {l.name}
          <small style={{ display: "block" }}>{l.label}</small>
        </p>
      ))}
      <strong>{money(o.total)}</strong>
    </article>
  );
  const empty = (
    <div className="roco-card">
      <h2>Your next order starts here.</h2>
      <p>
        Place a demo order as a customer, then switch roles to accept, prepare
        and deliver it.
      </p>
      <button
        className="roco-button primary"
        onClick={() => switchRole("Customer")}
      >
        Explore restaurants
      </button>
    </div>
  );
  return (
    <div className="demo-app">
      <div className="demo-banner">
        DEMO MODE · Sample businesses & simulated orders · No charges, payouts
        or production changes
      </div>
      <header className="demo-header">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            switchRole("Customer");
          }}
          className="demo-brand"
        >
          RoCo<span>Eats</span>
          <small>Good food. Close to home.</small>
        </a>
        <div className="demo-location">📍 Roane County, Tennessee</div>
        <select
          aria-label="Explore app role"
          value={role}
          onChange={(e) => switchRole(e.target.value)}
        >
          {["Customer", "Restaurant", "Driver", "Administrator"].map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </header>
      <div className="demo-layout">
        <nav className="demo-nav" aria-label="App sections">
          <div className="roco-kicker">{role} workspace</div>
          {nav.map((n) => (
            <button
              className={page === n ? "selected" : ""}
              key={n}
              onClick={() => {
                setPage(n);
                setMessage("");
                if (n === "Discover") setChosen("");
              }}
            >
              {n}
              {n === "Cart" && cart.length
                ? ` (${cart.reduce((n, x) => n + x.quantity, 0)})`
                : ""}
            </button>
          ))}
          <p className="roco-meta">
            Switch roles to follow the same demo order across the entire
            delivery.
          </p>
        </nav>
        <main className="demo-main">
          <div className="roco-kicker">ROCOEATS / {role.toUpperCase()}</div>
          <h1>
            {role === "Customer" && page === "Discover"
              ? chosen
                ? restaurants.find((r) => r.id === chosen)?.name
                : "Your neighborhood. Delivered."
              : page === "Overview"
                ? `Welcome to your ${role.toLowerCase()} dashboard.`
                : page}
          </h1>
          {message && (
            <p className="demo-message" role="status">
              {message}
            </p>
          )}
          {role === "Customer" &&
            page === "Discover" &&
            (!chosen ? (
              <>
                <p className="demo-lead">
                  Discover something delicious from your local favorites.
                </p>
                <div className="demo-hero">
                  <div>
                    <span className="roco-kicker">A LITTLE CLOSER TO HOME</span>
                    <h2>
                      Local flavor.
                      <br />A familiar kind of delivery.
                    </h2>
                    <p>Explore the RoCoEats ordering experience.</p>
                  </div>
                  <div className="demo-food">🍽️</div>
                </div>
                <div className="demo-grid">
                  {restaurants.map((r) => (
                    <button
                      className="demo-restaurant"
                      key={r.id}
                      onClick={() => setChosen(r.id)}
                    >
                      <div style={{ background: r.color }}>
                        {r.emoji}
                        <span>Sample restaurant</span>
                      </div>
                      <section>
                        <h2>{r.name}</h2>
                        <p>{r.kind}</p>
                        <strong>
                          {r.time} · {money(fee)} demo delivery
                        </strong>
                      </section>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <button className="roco-button" onClick={() => setChosen("")}>
                  ← All restaurants
                </button>
                <p className="demo-lead">
                  Sample menu · Prepared fresh · Customize before adding
                </p>
                {menu.map((item, index) => (
                  <article className="roco-card demo-menu" key={item.id}>
                    <div>
                      <span className="demo-menu-emoji">{item.emoji}</span>
                      <h2>{itemNames[index]}</h2>
                      <p>{item.description}</p>
                    </div>
                    <CustomizedAdd
                      item={{ ...item, name: itemNames[index] }}
                      onAdd={(selected, extra, label, instructions) => {
                        const key = item.id + JSON.stringify(selected) + instructions;
                        setCart((c) =>
                          c.some((l) => l.key === key)
                            ? c.map((l) =>
                                l.key === key
                                  ? { ...l, quantity: l.quantity + 1 }
                                  : l,
                              )
                            : [
                                ...c,
                                {
                                  key,
                                  name: itemNames[index],
                                  price: item.priceCents + extra,
                                  quantity: 1,
                                  label: [label,instructions].filter(Boolean).join(" · "),
                                },
                              ],
                        );
                        setMessage(
                          `${itemNames[index]} added to your demo cart`,
                        );
                      }}
                    />
                  </article>
                ))}
                <button
                  className="roco-button primary"
                  onClick={() => setPage("Cart")}
                >
                  Review cart & checkout
                </button>
              </>
            ))}
          {role === "Customer" &&
            page === "Cart" &&
            (cart.length ? (
              <div className="demo-columns">
                <section className="roco-card">
                  <h2>Your meal, your way</h2>
                  {cart.map((l) => (
                    <div className="demo-cart-line" key={l.key}>
                      <strong>{l.name}</strong>
                      <p>{l.label}</p>
                      <p>{money(l.price)} each</p>
                      <button
                        className="roco-button"
                        aria-label={`Remove one ${l.name}`}
                        onClick={() =>
                          setCart((c) =>
                            c.flatMap((x) =>
                              x.key !== l.key
                                ? [x]
                                : x.quantity > 1
                                  ? [{ ...x, quantity: x.quantity - 1 }]
                                  : [],
                            ),
                          )
                        }
                      >
                        −
                      </button>{" "}
                      {l.quantity}{" "}
                      <button
                        className="roco-button"
                        aria-label={`Add one ${l.name}`}
                        onClick={() =>
                          setCart((c) =>
                            c.map((x) =>
                              x.key === l.key
                                ? { ...x, quantity: x.quantity + 1 }
                                : x,
                            ),
                          )
                        }
                      >
                        +
                      </button>
                    </div>
                  ))}
                  <label>
                    Delivery address
                    <input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </label>
                  <label>
                    Driver tip
                    <select
                      value={tip}
                      onChange={(e) => setTip(Number(e.target.value))}
                    >
                      {[0, 200, 300, 500].map((t) => (
                        <option value={t} key={t}>
                          {money(t)}
                        </option>
                      ))}
                    </select>
                  </label>
                </section>
                <section className="roco-card">
                  <h2>Demo checkout</h2>
                  {[
                    ["Items", subtotal],
                    ["Delivery", fee],
                    ["Service", service],
                    ["Sample tax (9.75%)", tax],
                    ["Tip", tip],
                    ["Total", total],
                  ].map(([label, value]) => (
                    <p className="roco-row" key={label}>
                      <span>{label}</span>
                      <strong>{money(Number(value))}</strong>
                    </p>
                  ))}
                  <p>
                    Sample pricing only. No payment information is collected.
                  </p>
                  <button
                    className="roco-button primary"
                    disabled={!address.trim()}
                    onClick={() => {
                      setOrders((o) => [
                        {
                          id: String(Date.now()).slice(-6),
                          restaurant:
                            restaurants.find((r) => r.id === chosen)?.name ||
                            restaurants[0].name,
                          lines: cart,
                          total,
                          status: "Placed",
                          tip,
                        },
                        ...o,
                      ]);
                      setCart([]);
                      setPage("Orders");
                      setMessage(
                        "Demo order placed. Switch to Restaurant to accept it.",
                      );
                    }}
                  >
                    Place demo order · {money(total)}
                  </button>
                </section>
              </div>
            ) : (
              empty
            ))}
          {role === "Customer" &&
            page === "Orders" &&
            (orders.length
              ? orders.map((o) => (
                  <div key={o.id}>
                    {summary(o)}
                    <section className="roco-card">
                      <h3>Track your delivery</h3>
                      <ol className="demo-progress">
                        {stages.map((s, i) => (
                          <li
                            key={s}
                            className={
                              i <= stages.indexOf(o.status) ? "done" : ""
                            }
                          >
                            {s}
                          </li>
                        ))}
                      </ol>
                      <p>
                        Tracking is simulated. Driver GPS is not active in this
                        preview.
                      </p>
                      <button
                        className="roco-button"
                        disabled={[
                          "Delivered",
                          "Cancelled",
                          "Out for delivery",
                        ].includes(o.status)}
                        onClick={() => update(o.id, "Cancelled")}
                      >
                        Cancel demo order
                      </button>
                    </section>
                  </div>
                ))
              : empty)}
          {role === "Customer" && page === "Profile" && (
            <section className="roco-card">
              <h2>Your account</h2>
              <label>
                Name
                <input
                  value={profile}
                  onChange={(e) => setProfile(e.target.value)}
                />
              </label>
              <label>
                Default address
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </label>
              <button
                className="roco-button primary"
                onClick={() =>
                  setMessage("Demo profile updated in this preview session.")
                }
              >
                Save profile
              </button>
              <p>
                No account or login required. This preview uses temporary
                browser memory.
              </p>
            </section>
          )}
          {role === "Restaurant" && page === "Overview" && (
            <>
              <div className="demo-grid">
                {card(
                  "Incoming orders",
                  String(orders.filter((o) => o.status === "Placed").length),
                  "Waiting for your response",
                )}
                {card(
                  "Completed sales",
                  money(
                    orders
                      .filter((o) => o.status === "Delivered")
                      .reduce((n, o) => n + o.total, 0),
                  ),
                  "Simulated demo totals",
                )}
                {card(
                  "Kitchen status",
                  "Open",
                  "Demo restaurant accepting orders",
                )}
              </div>
              <button
                className="roco-button primary"
                onClick={() => setPage("Orders")}
              >
                Manage incoming orders
              </button>
            </>
          )}
          {role === "Restaurant" && page === "Menu" && (
            <>
              <p>
                Preview menu edits update the customer menu in this session.
              </p>
              {menu.map((m, i) => (
                <section className="roco-card" key={m.id}>
                  <label>
                    Item name
                    <input
                      value={itemNames[i]}
                      onChange={(e) =>
                        setItemNames((ns) =>
                          ns.map((n, j) => (j === i ? e.target.value : n)),
                        )
                      }
                    />
                  </label>
                  <p>
                    {money(m.priceCents)} · {m.modifierGroups.length} modifier
                    groups
                  </p>
                  <p>
                    {m.modifierGroups
                      .map(
                        (g) =>
                          `${g.name}: choose ${g.minSelections}–${g.maxSelections}`,
                      )
                      .join(" · ")}
                  </p>
                </section>
              ))}
            </>
          )}
          {role === "Restaurant" &&
            page === "Orders" &&
            (orders.length
              ? orders.map((o) => (
                  <div key={o.id}>
                    {summary(o)}
                    <div className="demo-actions">
                      {["Placed", "Accepted", "Preparing"].includes(
                        o.status,
                      ) && (
                        <button
                          className="roco-button primary"
                          onClick={() =>
                            update(o.id, stages[stages.indexOf(o.status) + 1])
                          }
                        >
                          {o.status === "Placed"
                            ? "Accept order"
                            : o.status === "Accepted"
                              ? "Start preparing"
                              : "Ready for pickup"}
                        </button>
                      )}
                      {!["Cancelled", "Delivered", "Out for delivery"].includes(
                        o.status,
                      ) && (
                        <button
                          className="roco-button"
                          onClick={() => update(o.id, "Cancelled")}
                        >
                          Decline / cancel demo order
                        </button>
                      )}
                    </div>
                  </div>
                ))
              : empty)}
          {role === "Driver" && page === "Overview" && (
            <>
              <section className="demo-hero">
                <div>
                  <h2>
                    {online
                      ? "You’re online. Let’s deliver."
                      : "Ready when you are."}
                  </h2>
                  <p>Explore delivery offers and earnings.</p>
                  <button
                    className="roco-button primary"
                    onClick={() => setOnline(!online)}
                  >
                    {online ? "Go offline" : "Go online"}
                  </button>
                </div>
                <div className="demo-food">🚗</div>
              </section>
              <div className="demo-grid">
                {card(
                  "Availability",
                  online ? "Online" : "Offline",
                  "Demo dispatch status",
                )}
                {card(
                  "Completed deliveries",
                  String(orders.filter((o) => o.status === "Delivered").length),
                  "This preview session",
                )}
              </div>
            </>
          )}
          {role === "Driver" &&
            page === "Offers" &&
            (!online ? (
              <section className="roco-card">
                <h2>Go online to see delivery offers</h2>
                <button
                  className="roco-button primary"
                  onClick={() => setOnline(true)}
                >
                  Go online
                </button>
              </section>
            ) : orders.some((o) => o.status === "Ready for pickup") ? (
              orders
                .filter((o) => o.status === "Ready for pickup")
                .map((o) => (
                  <div key={o.id}>
                    {summary(o)}
                    <button
                      className="roco-button primary"
                      disabled={!!assigned}
                      onClick={() => {
                        setAssigned(o.id);
                        setPage("Active delivery");
                      }}
                    >
                      Accept demo delivery · {money(fee + o.tip)}
                    </button>
                  </div>
                ))
            ) : (
              empty
            ))}
          {role === "Driver" &&
            page === "Active delivery" &&
            (assigned
              ? orders
                  .filter((o) => o.id === assigned)
                  .map((o) => (
                    <div key={o.id}>
                      {summary(o)}
                      <section className="roco-card">
                        <h2>
                          {o.status === "Ready for pickup"
                            ? "Collect the order"
                            : "Deliver to your neighbor"}
                        </h2>
                        <p>
                          {o.status === "Ready for pickup"
                            ? o.restaurant
                            : address}
                        </p>
                        <p>Navigation and GPS are inactive in demo mode.</p>
                        <button
                          className="roco-button primary"
                          onClick={() => {
                            if (o.status === "Ready for pickup")
                              update(o.id, "Out for delivery");
                            else {
                              update(o.id, "Delivered");
                              setAssigned("");
                              setPage("Earnings");
                            }
                          }}
                        >
                          {o.status === "Ready for pickup"
                            ? "Confirm pickup"
                            : "Complete demo delivery"}
                        </button>
                      </section>
                    </div>
                  ))
              : empty)}
          {(role === "Restaurant" || role === "Driver") &&
            page === "Earnings" && (
              <>
                <div className="demo-grid">
                  {card(
                    "Demo earnings",
                    money(
                      orders
                        .filter((o) => o.status === "Delivered")
                        .reduce(
                          (n, o) =>
                            n +
                            (role === "Driver"
                              ? fee + o.tip
                              : Math.round((o.total - fee - o.tip) * 0.8)),
                          0,
                        ),
                    ),
                    "Illustrative calculation; no transfers or payouts",
                  )}
                  {card(
                    "Payout account",
                    "Demo only",
                    "Stripe onboarding is not connected",
                  )}
                </div>
                <h2>Delivery & transaction history</h2>
                {orders.filter((o) => o.status === "Delivered").map(summary)}
              </>
            )}
          {role === "Administrator" && page === "Overview" && (
            <>
              <div className="demo-grid">
                {card("Orders", String(orders.length), "All demo activity")}
                {card(
                  "Active deliveries",
                  String(
                    orders.filter((o) => o.status === "Out for delivery")
                      .length,
                  ),
                  "Live within this preview",
                )}
                {card(
                  "Demo order volume",
                  money(orders.reduce((n, o) => n + o.total, 0)),
                  "Simulated transactions",
                )}
              </div>
              <section className="roco-card">
                <h2>Your local operations, in one place.</h2>
                <p>
                  Manage partners, follow deliveries and configure demo pricing
                  using the navigation.
                </p>
              </section>
            </>
          )}
          {role === "Administrator" && page === "Partners" && (
            <>
              <section className="roco-card">
                <h2>Restaurant applications</h2>
                <p>
                  Riverbend Kitchen · Sample partner ·{" "}
                  {approved ? "Approved" : "Awaiting approval"}
                </p>
                <button
                  className="roco-button primary"
                  onClick={() => setApproved(!approved)}
                >
                  {approved ? "Suspend demo partner" : "Approve demo partner"}
                </button>
              </section>
              <section className="roco-card">
                <h2>Driver management</h2>
                <p>
                  Demo Driver · Preview driver · {online ? "Online" : "Offline"}
                </p>
                <button
                  className="roco-button"
                  onClick={() => {
                    setOnline(false);
                    setMessage("Demo driver taken offline.");
                  }}
                >
                  Take offline
                </button>
              </section>
            </>
          )}
          {role === "Administrator" &&
            page === "Orders" &&
            (orders.length ? orders.map(summary) : empty)}
          {role === "Administrator" && page === "Finances" && (
            <>
              <div className="demo-grid">
                {card(
                  "Order volume",
                  money(
                    orders
                      .filter((o) => o.status !== "Cancelled")
                      .reduce((n, o) => n + o.total, 0),
                  ),
                  "Demo gross totals",
                )}
                {card(
                  "Refund queue",
                  String(orders.filter((o) => o.status === "Cancelled").length),
                  "Simulated cancellations only",
                )}
                {card(
                  "Live financial activity",
                  "$0.00",
                  "No charges, bank links or payouts",
                )}
              </div>
              <section className="roco-card">
                <h2>Financial integration</h2>
                <p>
                  Stripe and banking workflows are not connected to this
                  isolated preview.
                </p>
              </section>
            </>
          )}
          {role === "Administrator" && page === "Settings" && (
            <section className="roco-card">
              <h2>Delivery zones & demo pricing</h2>
              <label>
                Service area
                <input defaultValue="Roane County, Tennessee" />
              </label>
              <label>
                Demo delivery fee (cents)
                <input
                  type="number"
                  min="0"
                  max="2000"
                  value={fee}
                  onChange={(e) =>
                    setFee(Math.max(0, Math.min(2000, Number(e.target.value))))
                  }
                />
              </label>
              <p>
                Sample service fee: 5%. Sample tax: 9.75%. These are
                illustrative, not operating policies.
              </p>
              <button
                className="roco-button primary"
                onClick={() =>
                  setMessage("Demo settings applied to customer checkout.")
                }
              >
                Apply demo settings
              </button>
            </section>
          )}
          <footer className="demo-footer">
            RoCoEats · Built for Roane County · Interactive application preview
            <br />
            All sample data and actions reset when this page reloads.
          </footer>
        </main>
      </div>
    </div>
  );
}
