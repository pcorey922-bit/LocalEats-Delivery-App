import { z } from "zod";
import { cartLineKey } from "./cart-line";
const entry = z.object({
  menuItemId: z.string().uuid(),
  name: z.string().min(1).max(140),
  priceCents: z.number().int().min(0).max(2147483647),
  quantity: z.number().int().min(1).max(50),
  restaurantId: z.string().uuid(),
  restaurantName: z.string().max(200),
  modifiers: z
    .record(
      z.string().min(1).max(80),
      z.array(z.string().min(1).max(80)).max(30),
    )
    .refine((m) => Object.keys(m).length <= 20)
    .optional(),
  specialInstructions: z.string().max(500).optional(),
  customization: z.string().max(65000).optional(),
  lineId: z.string().optional(),
});
export type CartEntry = z.infer<typeof entry>;
const cartSchema = z
  .array(entry)
  .max(50)
  .refine(
    (items) => new Set(items.map((i) => i.restaurantId)).size <= 1,
    "Your cart can contain items from one restaurant.",
  )
  .refine(
    (items) =>
      new Set(
        items.map((i) =>
          cartLineKey(i.menuItemId, i.modifiers, i.specialInstructions),
        ),
      ).size === items.length,
    "Duplicate cart lines must be combined.",
  );
export type CartStorage = Pick<Storage, "getItem" | "setItem">;
export function createCustomerCart(owner: string | null, storage: CartStorage) {
  const key = owner ? `rocoeats-cart:v2:${owner}` : "rocoeats-guest-cart:v1";
  type Snapshot = { items: CartEntry[]; warning: string };
  function read(): Snapshot {
    if (!key) return { items: [], warning: "" };
    try {
      const raw = storage.getItem(key);
      if (!raw) return { items: [], warning: "" };
      const parsed = cartSchema.safeParse(JSON.parse(raw));
      if (!parsed.success)
        return {
          items: [],
          warning:
            "Your saved cart could not be restored. Please add your items again.",
        };
      return {
        items: parsed.data.map((i) => ({
          ...i,
          lineId: cartLineKey(i.menuItemId, i.modifiers, i.specialInstructions),
        })),
        warning: "",
      };
    } catch {
      return {
        items: [],
        warning:
          "Saved cart storage is unavailable. You can still build a cart for this session.",
      };
    }
  }
  let snapshot = read();
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((fn) => fn());
  return {
    key,
    getSnapshot: () => snapshot,
    subscribe: (fn: () => void) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    reload: () => {
      snapshot = read();
      emit();
    },
    setItems: (
      update: CartEntry[] | ((previous: CartEntry[]) => CartEntry[]),
    ) => {
      if (!key) return;
      const candidate =
        typeof update === "function" ? update(snapshot.items) : update;
      const parsed = cartSchema.safeParse(candidate);
      if (!parsed.success) {
        snapshot = {
          ...snapshot,
          warning:
            "Cart limit reached or invalid items detected. Use at most 50 lines and 50 of each item from one restaurant.",
        };
        emit();
        return;
      }
      const items = parsed.data.map((i) => ({
        ...i,
        lineId: cartLineKey(i.menuItemId, i.modifiers, i.specialInstructions),
      }));
      let warning = "";
      try {
        storage.setItem(key, JSON.stringify(items));
      } catch {
        warning =
          "Your cart is available for this session but could not be saved on this device.";
      }
      snapshot = { items, warning };
      emit();
    },
  };
}
