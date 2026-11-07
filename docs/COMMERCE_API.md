# Test commerce API

All paths below are relative to `/api`. JSON errors use `{error:string}`.
Except config/approved availability and the signed Stripe webhook, endpoints
require a Clerk session and active profile. Driver dispatch additionally requires
administrator approval. No endpoint enables live charges.

| Endpoint | Access | Purpose |
| --- | --- | --- |
| `GET /commerce/config` | Public | Test provider, illustrative pricing and service ZIPs |
| `POST /orders/quote` | Customer | Calculate authoritative test fees/tax/tip; no order is created |
| `POST /orders` | Customer | Create pending-payment order with reviewed total and UUID `Idempotency-Key` header |
| `POST /orders/:id/checkout` | Customer owner or admin | Create/reuse a test hosted session or local simulation |
| `POST /orders/:id/sandbox-payment` | Customer owner or admin, local sandbox only | `{outcome:"succeeded"|"declined"}`; never moves money |
| `GET /orders/:id/payment` | Customer owner or admin | Payment and full-refund status |
| `POST /orders/:id/cancel` | Customer owner, restaurant owner, or admin | `{reason:string}`; cancel with full test refund as applicable |
| `PATCH /orders/:id` | Restaurant owner or admin | Legal kitchen status transitions; fulfillment requires paid state |
| `GET /orders/me` | Customer, restaurant owner, admin | Role-scoped order history/status/events |
| `GET /driver/offers` | Approved driver | Paid pickup offers; customer addresses omitted |
| `GET /driver/deliveries` | Approved driver | Only that driver's deliveries and delivery details |
| `POST /driver/orders/:id/claim` | Approved driver | Conditional single-winner assignment |
| `POST /driver/orders/:id/release` | Assigned approved driver | Release before pickup for reassignment |
| `POST /driver/orders/:id/pickup` | Assigned approved driver | Pickup before completion |
| `POST /driver/orders/:id/deliver` | Assigned approved driver | Complete and accrue immutable earnings |
| `GET /payouts/me` | Restaurant/driver | Own test earnings/settlement states |
| `GET /payout-account` | Restaurant/driver | Own test Connect/sandbox readiness |
| `POST /payout-account/onboard` | Restaurant/driver | Test account creation and hosted onboarding link |
| `GET /notifications` | Active profile | Own latest 100 durable notifications |
| `POST /notifications/:id/read` | Recipient | Mark own notification read |
| `GET /notification-devices/config` | Active profile | Android/iOS push configuration availability |
| `POST /notification-devices` | Active profile | `{platform:"android"|"ios",token:string}`; register a device |
| `DELETE /notification-devices` | Active profile | `{token:string}`; unregister own device |
| `GET /restaurants/:id/availability` | Public, approved listing | Pause state, hours, Eastern timezone and current opening state |
| `GET /restaurants/me/availability/settings` | Restaurant owner | Own pause/opening-hour settings |
| `PUT /restaurants/me/availability/settings` | Restaurant owner | `{acceptingOrders:boolean,hours:[{weekday,isClosed,openTime,closeTime}]}`; seven unique weekdays, Sunday=0, `HH:mm`, close may be `24:00` |
| `POST /account/deletion-request` | Active profile | Queue account removal for operational/retention handling |
| `GET /admin/drivers` | Admin | Driver approval queue |
| `PATCH /admin/drivers/:id/approval` | Admin | `{approved:boolean}`; approve/revoke dispatch access |
| `GET /admin/payouts` | Admin | Latest 200 test settlements |
| `POST /admin/payouts/:id/transfer` | Admin | Idempotent transfer to ready test connected balance |
| `GET /admin/refunds` | Admin | Latest 200 full-refund requests, including late cancelled-order payments |
| `PUT /admin/pricing` | Admin | Strict test pricing policy, retaining existing order snapshots |
| `GET /admin/audit` | Admin | Latest 200 immutable operation records |
| `GET /admin/deletion-requests` | Admin | Account-deletion operations queue |
| `POST /webhooks/stripe` | Stripe test signature, raw body | Signed payment/refund confirmation and replay protection |

Quote and order input follows `PlaceOrderInput` in `lib/api-spec/openapi.yaml`:
restaurant/address UUIDs, item UUIDs and quantities, optional tip cents, and
`expectedTotalCents` from a fresh quote for creation. Client prices are ignored.
Reusing an idempotency UUID with a different parsed input returns 409.

Customers can cancel only before acceptance. Restaurant owners can cancel before
pickup; administrators can request a full refund after delivery. A refund after
completed delivery preserves the delivered status/history and reverses earnings.
Paid cancellation expires open checkout first, never reopens cancelled dispatch,
and exposes pending/failed refunds for support. Partial external refunds and
unknown old provider operations require reconciliation rather than blind retries.

## Protected administrator dispatch

`POST /admin/orders/:id/assignment` requires an active administrator and JSON:
`{driverProfileId:UUID|null,expectedDriverProfileId:UUID|null,expectedAssignedAt:ISO|null,reason:string}`.
Use the observed driver and assignment timestamp from `GET /admin/dispatch`.
A null destination releases the assignment; stale observations return 409 and must
be refreshed. Reasons require 5–500 characters. Only paid, ready, unpicked orders
can change assignment. Drivers must be active, approved, online and free of another
active delivery, with unexpired approved applications when present. An approved
owner-driver is eligible under the same checks. Administrative assignment is immediate;
driver pickup confirms possession. Assignment offers requiring separate acceptance
are not implemented by this endpoint.

Changes commit the assignment, previous-driver GPS deletion, recipient notifications
(including the removed driver) and reason-bearing audit record together. Driver
release also clears assigned-order GPS. Push still requires configured providers and
physical-device verification. Reassignment after pickup requires support review;
this endpoint refuses it rather than silently changing delivery custody.

`POST /driver/orders/:id/arrive` lets the assigned approved driver attest arrival
before pickup. Concurrent retries return the original timestamp and generate one
arrival notification per recipient and one audit record. `arrivedAt` is visible in
own deliveries and administrator dispatch. Reassignment/release clears the timestamp.
This is driver-reported coordination, not verified GPS or proof of food pickup.

## Restaurant admission capacity

Owner availability settings accept optional `maxOpenOrders` (null for unlimited, or
an integer from 1–1000). Omitting it preserves the existing limit. Owner reads include
`openOrders`; public availability includes `capacityAvailable` and closes `isOpen`
when full. Active orders include pending payment through ready-for-pickup; pickup
and cancellation free capacity. Checkout locks the restaurant, rechecks its limit
and snapshots, and reserves one slot atomically. Retries acknowledge their existing
order even when capacity is full. Lowering capacity never cancels existing orders.
Pending-payment reservations currently require customer/operator cancellation to free
them; unattended expiration and escalation remain unfinished launch requirements.

## Item stock and menu customization

Menu reads now include configured modifier groups in customer and owner views.
`GET /restaurants/me` resolves before public restaurant-ID lookup.

`GET /restaurants/me/inventory` returns owned item IDs/names, available `stockOnHand`
and integer `revision`. Null stock means untracked; zero marks an otherwise listed
item sold out. `PUT /restaurants/me/inventory/:itemId` accepts
`{stockOnHand:integer|null,expectedRevision:integer,reason:string}`. Stock is 0–1,000,000;
reasons require 5–500 characters. Only the item's restaurant owner can adjust it.
A stale revision returns 409. Adjustments and their before/after audit commit together.

Checkout aggregates quantities across all customization/instruction lines for the same
item, locks stock rows in stable ID order, and deducts tracked units atomically with
order creation. Retries never deduct twice. Per-line deducted quantities distinguish
tracked reservations from historical/untracked orders. Pending payments retain stock
until cancellation. Cancellations before restaurant acceptance return deducted units
once, in both sandbox and durable Stripe-test cancellation paths. Accepted/prepared
food does not automatically return to available stock; restaurant staff must record
an appropriate reasoned adjustment. Deleted/untracked items are not fabricated or
recreated. Limits are item units, not modifier/ingredient-level inventory.

## Reservation and timeout recovery

Unpaid orders expire at persisted `reservationExpiresAt`; cancellation, stock return,
audit, notification and provider-expiration jobs are atomic. Late Stripe success keeps
the order cancelled and queues refund recovery. Paid orders do not expire as unpaid.

Administrators GET/PUT `/admin/order-timing` (PUT `{policy,reason}`) to configure
`reservationMinutes` (1–120), `restaurantResponseMinutes` (1–120),
`driverAssignmentMinutes` (1–240), `driverPickupMinutes` (1–240). New orders snapshot
this policy; defaults are 15/5/10/10. GET `/admin/order-incidents?status=active|resolved`
returns the latest 100 matching incidents. POST `/admin/order-incidents/:id/acknowledge`
requires `{version,note}`; notes are 10–1000 characters. Stale versions return 409.
Acknowledgement does not resolve a still-active exception. Use dispatch, restaurant
status, cancellation/refund and support controls for recovery. Background review
resolves incidents when actual state recovers. Arrival-reported drivers are never
silently released by a timeout; no paid order is automatically refunded on timeout.

## Platform-funded partial test credits

Admin GET/POST `/admin/orders/:id/partial-refunds`. POST requires
`{id:UUID,amountCents:positiveInteger,fundingPolicy:"platform_goodwill_v1",reason:string}`
with a 10–500 character reason. Only delivered, paid Stripe test orders qualify.
Pending/successful requests reserve the cumulative budget; the total must remain
below the original charge. Same-ID/body retries return the saved request; conflicts
return 409. Full-refund requests block while partial outcomes are unresolved, then
refund only the remaining amount. The original full-refund record remains unique;
partial records are separate immutable financial requests. Receipts include
`partialRefunds`. This policy is paid by RoCoEats and preserves restaurant/driver
allocations and tips; recipient/tax-funded partial allocation remains unfinished.
