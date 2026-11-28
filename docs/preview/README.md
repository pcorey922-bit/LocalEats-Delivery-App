# Interactive application preview

Build the existing frontend with `VITE_DEMO_MODE=true pnpm --filter @workspace/localeats build`.
The default build retains the authenticated application. The preview build loads an isolated
React experience from `src/pages/demo-preview.tsx` and reuses the menu modifier component.
It makes no backend requests, collects no payment credentials and uses only temporary
browser memory. Sample restaurants, demo settings, order lifecycle, earnings and partner
management are simulated. Reloading resets everything.

Use the header role selector to explore Customer, Restaurant, Driver and Administrator.
Place a customer order, switch to Restaurant / Orders to accept, prepare and mark ready;
switch to Driver, go online, accept the offer, confirm pickup and complete delivery.
Customer / Orders and Administrator / Orders reflect those same local demo orders.

Browser verification: restaurant discovery, required modifiers, customized pricing,
cart, checkout, cross-role acceptance/preparation/pickup/delivery, driver earnings and
owner overview passed. A 390px iframe viewport verified mobile layout. No application
JavaScript errors were observed; the browser extension generated unrelated metadata errors.
Frontend typecheck and demo production build passed. Screenshots here came from the
running local preview. This is an interactive demo build, not a deployed transactional backend.
