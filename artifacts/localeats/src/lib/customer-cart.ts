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
  );
export type CartStorage = Pick<Storage, "getItem" | "setItem">;
type Snapshot = { items: CartEntry[]; warning: string };
function normalize(items: CartEntry[]): CartEntry[] {
  const combined = new Map<string, CartEntry>();
  for (const item of items) {
    const modifiers = Object.fromEntries(
      Object.entries(item.modifiers ?? {}).filter(
        ([, options]) => options.length,
      ),
    );
    const lineId = cartLineKey(
      item.menuItemId,
      modifiers,
      item.specialInstructions,
    );
    const previous = combined.get(lineId);
    const quantity = item.quantity + (previous?.quantity ?? 0);
    if (quantity > 50) throw new Error("Cart quantity limit");
    combined.set(lineId, {
      ...item,
      modifiers,
      specialInstructions: item.specialInstructions?.trim(),
      lineId,
      quantity,
    });
  }
  return [...combined.values()];
}
export function createCustomerCart(
  owner: string | null | undefined,
  storage: CartStorage,
) {
  // Undefined means Clerk has not resolved identity. Never read the guest cart then.
  const key =
    owner === undefined
      ? null
      : owner
        ? `rocoeats-cart:v2:${owner}`
        : "rocoeats-guest-cart:v1";
  let lastRaw: string | null = null;
  function decode(raw: string | null): Snapshot {
    if (!raw) return { items: [], warning: "" };
    try {
      const parsed = cartSchema.parse(JSON.parse(raw));
      const items = normalize(parsed);
      return {
        items,
        warning:
          items.length < parsed.length
            ? "Identical saved cart lines were combined. Please review quantities."
            : "",
      };
    } catch {
      return {
        items: [],
        warning:
          "Your saved cart could not be restored. Please add your items again.",
      };
    }
  }
  let snapshot: Snapshot;
  try {
    lastRaw = key ? storage.getItem(key) : null;
    snapshot = decode(lastRaw);
  } catch {
    snapshot = {
      items: [],
      warning:
        "Saved cart storage is unavailable. You can still build a cart for this session.",
    };
  }
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((fn) => fn());
  const reload = () => {
    if (!key) return;
    try {
      const raw = storage.getItem(key);
      // Retain session-only edits after a failed save. Unchanged storage is not
      // evidence that an older saved cart should replace the live cart on resume.
      if (raw === lastRaw) return;
      snapshot = decode(raw);
      lastRaw = raw;
      emit();
    } catch {
      // A temporary storage failure must not erase the current cart.
    }
  };
  return {
    key,
    getSnapshot: () => snapshot,
    subscribe: (fn: () => void) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    reload,
    setItems: (
      update: CartEntry[] | ((previous: CartEntry[]) => CartEntry[]),
    ) => {
      if (!key) return;
      reload();
      let items: CartEntry[];
      try {
        const candidate =
          typeof update === "function" ? update(snapshot.items) : update;
        items = normalize(cartSchema.parse(candidate));
      } catch {
        snapshot = {
          ...snapshot,
          warning:
            "Cart limit reached or invalid items detected. Use at most 50 lines and 50 of each item from one restaurant.",
        };
        emit();
        return;
      }
      let warning = "";
      try {
        const raw = JSON.stringify(items);
        storage.setItem(key, raw);
        lastRaw = raw;
      } catch {
        warning =
          "Your cart is available for this session but could not be saved on this device.";
      }
      snapshot = { items, warning };
      emit();
    },
  };
}

export function createCustomerCartRegistry(storage: CartStorage) {
  const stores = new Map<
    string | null | undefined,
    ReturnType<typeof createCustomerCart>
  >();
  return {
    get(owner: string | null | undefined) {
      let store = stores.get(owner);
      if (!store) {
        store = createCustomerCart(owner, storage);
        stores.set(owner, store);
      }
      return store;
    },
    reload(key: string | null = null) {
      for (const store of stores.values())
        if (key === null || key === store.key) store.reload();
    },
  };
}
