import { NavigationActions } from "../src/pages/navigation-actions";
import { DispatchMap } from "../src/pages/dispatch-map";
// Browser-only fixture: never imported by the production entry or router.
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { CustomizedAdd } from "../src/pages/menu-modifiers";
import { useCartForOwner } from "../src/hooks/use-customer-cart";
import { cartLineKey } from "../src/lib/cart-line";
function Fixture() {
  const [owner, setOwner] = useState("qa-customer-a");
  const [cart, setCart, warning] = useCartForOwner(owner);
  const item = {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Test burger",
    priceCents: 1000,
    modifierGroups: [
      {
        id: "side",
        name: "Side",
        minSelections: 1,
        maxSelections: 1,
        options: [
          { id: "fries", name: "Fries", priceCents: 0 },
          { id: "salad", name: "Salad", priceCents: 200 },
        ],
      },
    ],
  };
  return (
    <main>
      <h1>RoCoEats cart and dispatch component verification</h1>
      <p>
        Isolated fixture · simulated account IDs · no backend or live payments
      </p>
      <label>
        Fixture account
        <select value={owner} onChange={(e) => setOwner(e.target.value)}>
          <option value="qa-customer-a">Customer A</option>
          <option value="qa-customer-b">Customer B</option>
        </select>
      </label>
      <CustomizedAdd
        key={owner}
        item={item}
        onAdd={(modifiers, extra, customization, specialInstructions) => {
          const lineId = cartLineKey(item.id, modifiers, specialInstructions);
          setCart((old) =>
            old.some((i) => i.lineId === lineId)
              ? old.map((i) =>
                  i.lineId === lineId ? { ...i, quantity: i.quantity + 1 } : i,
                )
              : [
                  ...old,
                  {
                    lineId,
                    menuItemId: item.id,
                    name: item.name,
                    restaurantId: "00000000-0000-4000-8000-000000000002",
                    restaurantName: "Test kitchen",
                    quantity: 1,
                    priceCents: item.priceCents + extra,
                    modifiers,
                    customization,
                    specialInstructions,
                  },
                ],
          );
        }}
      />
      {warning && <p role="alert">{warning}</p>}
      <h2>Cart: {cart.length} lines</h2>
      <ul>
        {cart.map((i) => (
          <li key={i.lineId}>
            {i.quantity} × {i.name} · {i.customization} ·{" "}
            {i.specialInstructions} · $
            {((i.priceCents * i.quantity) / 100).toFixed(2)}
          </li>
        ))}
      </ul>
      <button onClick={() => setCart([])}>Clear fixture cart</button>
      <h2>Navigation and dispatch fixture (simulated GPS)</h2>
      <NavigationActions
        label="Navigate to Restaurant"
        address={{
          street1: "123 Sample Street",
          city: "Rockwood",
          region: "TN",
          postalCode: "37854",
        }}
      />
      <NavigationActions label="Navigate to Customer" address={null} />
      <DispatchMap
        drivers={[
          {
            profileId: "qa-driver",
            displayName: "Fixture driver",
            online: true,
            approved: true,
            status: "delivering",
            activeOrderId: "qa-order",
            locationStatus: "stale",
            location: {
              latitude: 35.88,
              longitude: -84.69,
              accuracyMeters: 8,
              observedAt: new Date(Date.now() - 180000).toISOString(),
            },
          },
        ]}
      />
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
