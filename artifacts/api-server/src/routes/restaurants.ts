import { and, asc, eq, ilike, inArray, or } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateMyRestaurantBody,
  CreateMyRestaurantCategoryBody,
  CreateMyRestaurantCategoryResponse,
  CreateMyRestaurantMenuItemBody,
  CreateMyRestaurantMenuItemResponse,
  CreateMyRestaurantResponse,
  DeleteMyRestaurantCategoryParams,
  DeleteMyRestaurantMenuItemParams,
  GetMyRestaurantResponse,
  GetRestaurantParams,
  GetRestaurantResponse,
  ListRestaurantsQueryParams,
  ListRestaurantsResponse,
  UpdateMyRestaurantBody,
  UpdateMyRestaurantCategoryBody,
  UpdateMyRestaurantCategoryParams,
  UpdateMyRestaurantCategoryResponse,
  UpdateMyRestaurantMenuItemBody,
  UpdateMyRestaurantMenuItemParams,
  UpdateMyRestaurantMenuItemResponse,
  UpdateMyRestaurantResponse,
} from "@workspace/api-zod";
import {
  db,
  menuCategoriesTable,
  menuItemsTable,
  restaurantsTable,
} from "@workspace/db";
import { getActiveProfile, requireRole } from "../lib/current-profile";
import { requireAuth } from "../middlewares/require-auth";

const router: IRouter = Router();

async function loadCategories(restaurantId: string, includeUnavailable: boolean) {
  const categories = await db
    .select()
    .from(menuCategoriesTable)
    .where(eq(menuCategoriesTable.restaurantId, restaurantId))
    .orderBy(asc(menuCategoriesTable.sortOrder), asc(menuCategoriesTable.name));

  if (categories.length === 0) return [];

  const items = await db
    .select()
    .from(menuItemsTable)
    .where(
      includeUnavailable
        ? eq(menuItemsTable.restaurantId, restaurantId)
        : and(
            eq(menuItemsTable.restaurantId, restaurantId),
            eq(menuItemsTable.isAvailable, true),
          ),
    )
    .orderBy(asc(menuItemsTable.name));

  return categories
    .map((category) => ({
      id: category.id,
      name: category.name,
      sortOrder: category.sortOrder,
      items: items
        .filter((item) => item.categoryId === category.id)
        .map((item) => ({
          id: item.id,
          categoryId: item.categoryId,
          name: item.name,
          description: item.description,
          priceCents: item.priceCents,
          isAvailable: item.isAvailable,
        })),
    }))
    .filter((category) => includeUnavailable || category.items.length > 0);
}

async function ownerView(restaurant: typeof restaurantsTable.$inferSelect) {
  return {
    id: restaurant.id,
    name: restaurant.name,
    description: restaurant.description,
    phone: restaurant.phone,
    street1: restaurant.street1,
    street2: restaurant.street2,
    city: restaurant.city,
    region: restaurant.region,
    postalCode: restaurant.postalCode,
    status: restaurant.status,
    categories: await loadCategories(restaurant.id, true),
  };
}

function restaurantValues(data: {
  name?: string;
  description?: string | null;
  phone?: string | null;
  street1?: string;
  street2?: string | null;
  city?: string;
  region?: string;
  postalCode?: string;
}) {
  const result: Record<string, string | null> = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string") {
      const cleaned = value.trim();
      result[key] = cleaned || (key === "description" || key === "phone" || key === "street2" ? null : "");
    } else if (value === null) {
      result[key] = null;
    }
  }
  return result;
}

router.get("/restaurants", async (req, res): Promise<void> => {
  const parsed = ListRestaurantsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid restaurant search" });
    return;
  }

  const search = parsed.data.search?.trim();
  const conditions = [eq(restaurantsTable.status, "approved")];
  if (search) {
    const pattern = `%${search.replace(/[%_]/g, "\\$&")}%`;
    conditions.push(
      or(
        ilike(restaurantsTable.name, pattern),
        ilike(restaurantsTable.city, pattern),
        ilike(restaurantsTable.region, pattern),
      )!,
    );
  }

  const restaurants = await db
    .select({
      id: restaurantsTable.id,
      name: restaurantsTable.name,
      description: restaurantsTable.description,
      city: restaurantsTable.city,
      region: restaurantsTable.region,
    })
    .from(restaurantsTable)
    .where(and(...conditions))
    .orderBy(asc(restaurantsTable.name))
    .limit(100);

  res.json(ListRestaurantsResponse.parse(restaurants));
});

router.get("/restaurants/:restaurantId", async (req, res): Promise<void> => {
  const params = GetRestaurantParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid restaurant id" });
    return;
  }

  const [restaurant] = await db
    .select()
    .from(restaurantsTable)
    .where(
      and(
        eq(restaurantsTable.id, params.data.restaurantId),
        eq(restaurantsTable.status, "approved"),
      ),
    )
    .limit(1);

  if (!restaurant) {
    res.status(404).json({ error: "Restaurant not found" });
    return;
  }

  const view = {
    id: restaurant.id,
    name: restaurant.name,
    description: restaurant.description,
    phone: restaurant.phone,
    street1: restaurant.street1,
    street2: restaurant.street2,
    city: restaurant.city,
    region: restaurant.region,
    postalCode: restaurant.postalCode,
    categories: await loadCategories(restaurant.id, false),
  };

  res.json(GetRestaurantResponse.parse(view));
});

router.get("/restaurants/me", requireAuth, async (req, res): Promise<void> => {
  const profile = await getActiveProfile(req, res);
  if (!profile || !requireRole(profile, ["restaurant"], res)) return;

  const [restaurant] = await db
    .select()
    .from(restaurantsTable)
    .where(eq(restaurantsTable.ownerProfileId, profile.id))
    .limit(1);

  if (!restaurant) {
    res.status(404).json({ error: "Restaurant profile has not been created" });
    return;
  }

  res.json(GetMyRestaurantResponse.parse(await ownerView(restaurant)));
});

router.post("/restaurants/me", requireAuth, async (req, res): Promise<void> => {
  const profile = await getActiveProfile(req, res);
  if (!profile || !requireRole(profile, ["restaurant"], res)) return;

  const parsed = CreateMyRestaurantBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter a valid restaurant name and address" });
    return;
  }

  const values = restaurantValues(parsed.data);
  if (!values.name || !values.street1 || !values.city || !values.postalCode) {
    res.status(400).json({ error: "Restaurant name and address fields cannot be blank" });
    return;
  }

  const [existing] = await db
    .select({ id: restaurantsTable.id })
    .from(restaurantsTable)
    .where(eq(restaurantsTable.ownerProfileId, profile.id))
    .limit(1);
  if (existing) {
    res.status(409).json({ error: "This account already has a restaurant" });
    return;
  }

  const [restaurant] = await db
    .insert(restaurantsTable)
    .values({
      ownerProfileId: profile.id,
      name: values.name,
      description: values.description ?? null,
      phone: values.phone ?? null,
      street1: values.street1,
      street2: values.street2 ?? null,
      city: values.city,
      region: values.region || "Tennessee",
      postalCode: values.postalCode,
      status: "pending",
    })
    .onConflictDoNothing({ target: restaurantsTable.ownerProfileId })
    .returning();

  if (!restaurant) {
    res.status(409).json({ error: "This account already has a restaurant" });
    return;
  }

  res.status(201).json(CreateMyRestaurantResponse.parse(await ownerView(restaurant)));
});

router.patch("/restaurants/me", requireAuth, async (req, res): Promise<void> => {
  const profile = await getActiveProfile(req, res);
  if (!profile || !requireRole(profile, ["restaurant"], res)) return;

  const parsed = UpdateMyRestaurantBody.safeParse(req.body);
  if (!parsed.success || Object.keys(parsed.data ?? {}).length === 0) {
    res.status(400).json({ error: "Enter at least one valid restaurant field" });
    return;
  }

  const values = restaurantValues(parsed.data);
  for (const requiredField of ["name", "street1", "city", "postalCode"]) {
    if (requiredField in values && !values[requiredField]) {
      res.status(400).json({ error: "Restaurant name and address fields cannot be blank" });
      return;
    }
  }

  const [restaurant] = await db
    .update(restaurantsTable)
    .set(values)
    .where(eq(restaurantsTable.ownerProfileId, profile.id))
    .returning();

  if (!restaurant) {
    res.status(404).json({ error: "Restaurant profile has not been created" });
    return;
  }

  res.json(UpdateMyRestaurantResponse.parse(await ownerView(restaurant)));
});

router.post(
  "/restaurants/me/categories",
  requireAuth,
  async (req, res): Promise<void> => {
    const profile = await getActiveProfile(req, res);
    if (!profile || !requireRole(profile, ["restaurant"], res)) return;

    const parsed = CreateMyRestaurantCategoryBody.safeParse(req.body);
    if (!parsed.success || !parsed.data.name.trim()) {
      res.status(400).json({ error: "Enter a category name" });
      return;
    }
    const [restaurant] = await db
      .select({ id: restaurantsTable.id })
      .from(restaurantsTable)
      .where(eq(restaurantsTable.ownerProfileId, profile.id))
      .limit(1);
    if (!restaurant) {
      res.status(404).json({ error: "Restaurant profile has not been created" });
      return;
    }

    const [category] = await db
      .insert(menuCategoriesTable)
      .values({
        restaurantId: restaurant.id,
        name: parsed.data.name.trim(),
        sortOrder: parsed.data.sortOrder ?? 0,
      })
      .returning();
    res
      .status(201)
      .json(CreateMyRestaurantCategoryResponse.parse({ ...category, items: [] }));
  },
);

router.patch(
  "/restaurants/me/categories/:categoryId",
  requireAuth,
  async (req, res): Promise<void> => {
    const profile = await getActiveProfile(req, res);
    if (!profile || !requireRole(profile, ["restaurant"], res)) return;
    const params = UpdateMyRestaurantCategoryParams.safeParse(req.params);
    const parsed = UpdateMyRestaurantCategoryBody.safeParse(req.body);
    if (!params.success || !parsed.success || Object.keys(parsed.data ?? {}).length === 0) {
      res.status(400).json({ error: "Enter a valid category update" });
      return;
    }
    if (parsed.data.name !== undefined && !parsed.data.name.trim()) {
      res.status(400).json({ error: "Category name cannot be blank" });
      return;
    }

    const [restaurant] = await db
      .select({ id: restaurantsTable.id })
      .from(restaurantsTable)
      .where(eq(restaurantsTable.ownerProfileId, profile.id))
      .limit(1);
    if (!restaurant) {
      res.status(404).json({ error: "Restaurant profile has not been created" });
      return;
    }
    const [category] = await db
      .update(menuCategoriesTable)
      .set({
        ...(parsed.data.name !== undefined && { name: parsed.data.name.trim() }),
        ...(parsed.data.sortOrder !== undefined && { sortOrder: parsed.data.sortOrder }),
      })
      .where(
        and(
          eq(menuCategoriesTable.id, params.data.categoryId),
          eq(menuCategoriesTable.restaurantId, restaurant.id),
        ),
      )
      .returning();
    if (!category) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
    res.json(
      UpdateMyRestaurantCategoryResponse.parse({ ...category, items: [] }),
    );
  },
);

router.delete(
  "/restaurants/me/categories/:categoryId",
  requireAuth,
  async (req, res): Promise<void> => {
    const profile = await getActiveProfile(req, res);
    if (!profile || !requireRole(profile, ["restaurant"], res)) return;
    const params = DeleteMyRestaurantCategoryParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: "Invalid category id" });
      return;
    }
    const [restaurant] = await db
      .select({ id: restaurantsTable.id })
      .from(restaurantsTable)
      .where(eq(restaurantsTable.ownerProfileId, profile.id))
      .limit(1);
    if (!restaurant) {
      res.status(404).json({ error: "Restaurant profile has not been created" });
      return;
    }
    const [category] = await db
      .select({ id: menuCategoriesTable.id })
      .from(menuCategoriesTable)
      .where(
        and(
          eq(menuCategoriesTable.id, params.data.categoryId),
          eq(menuCategoriesTable.restaurantId, restaurant.id),
        ),
      )
      .limit(1);
    if (!category) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
    const [item] = await db
      .select({ id: menuItemsTable.id })
      .from(menuItemsTable)
      .where(eq(menuItemsTable.categoryId, category.id))
      .limit(1);
    if (item) {
      res.status(409).json({ error: "Move or remove the category's menu items first" });
      return;
    }
    await db.delete(menuCategoriesTable).where(eq(menuCategoriesTable.id, category.id));
    res.sendStatus(204);
  },
);

router.post(
  "/restaurants/me/menu-items",
  requireAuth,
  async (req, res): Promise<void> => {
    const profile = await getActiveProfile(req, res);
    if (!profile || !requireRole(profile, ["restaurant"], res)) return;
    const parsed = CreateMyRestaurantMenuItemBody.safeParse(req.body);
    if (!parsed.success || !parsed.data.name.trim()) {
      res.status(400).json({ error: "Enter a valid menu item" });
      return;
    }
    const [restaurant] = await db
      .select({ id: restaurantsTable.id })
      .from(restaurantsTable)
      .where(eq(restaurantsTable.ownerProfileId, profile.id))
      .limit(1);
    if (!restaurant) {
      res.status(404).json({ error: "Restaurant profile has not been created" });
      return;
    }
    const [category] = await db
      .select({ id: menuCategoriesTable.id })
      .from(menuCategoriesTable)
      .where(
        and(
          eq(menuCategoriesTable.id, parsed.data.categoryId),
          eq(menuCategoriesTable.restaurantId, restaurant.id),
        ),
      )
      .limit(1);
    if (!category) {
      res.status(404).json({ error: "Menu category not found" });
      return;
    }
    const [item] = await db
      .insert(menuItemsTable)
      .values({
        restaurantId: restaurant.id,
        categoryId: category.id,
        name: parsed.data.name.trim(),
        description: parsed.data.description?.trim() || null,
        priceCents: parsed.data.priceCents,
        isAvailable: parsed.data.isAvailable ?? true,
        modifierGroups: parsed.data.modifierGroups,
      })
      .returning();
    res.status(201).json(CreateMyRestaurantMenuItemResponse.parse(item));
  },
);

router.patch(
  "/restaurants/me/menu-items/:menuItemId",
  requireAuth,
  async (req, res): Promise<void> => {
    const profile = await getActiveProfile(req, res);
    if (!profile || !requireRole(profile, ["restaurant"], res)) return;
    const params = UpdateMyRestaurantMenuItemParams.safeParse(req.params);
    const parsed = UpdateMyRestaurantMenuItemBody.safeParse(req.body);
    if (!params.success || !parsed.success || Object.keys(parsed.data ?? {}).length === 0) {
      res.status(400).json({ error: "Enter a valid menu item update" });
      return;
    }
    if (parsed.data.name !== undefined && !parsed.data.name.trim()) {
      res.status(400).json({ error: "Menu item name cannot be blank" });
      return;
    }
    const [restaurant] = await db
      .select({ id: restaurantsTable.id })
      .from(restaurantsTable)
      .where(eq(restaurantsTable.ownerProfileId, profile.id))
      .limit(1);
    if (!restaurant) {
      res.status(404).json({ error: "Restaurant profile has not been created" });
      return;
    }
    if (parsed.data.categoryId) {
      const [category] = await db
        .select({ id: menuCategoriesTable.id })
        .from(menuCategoriesTable)
        .where(
          and(
            eq(menuCategoriesTable.id, parsed.data.categoryId),
            eq(menuCategoriesTable.restaurantId, restaurant.id),
          ),
        )
        .limit(1);
      if (!category) {
        res.status(404).json({ error: "Menu category not found" });
        return;
      }
    }
    const [item] = await db
      .update(menuItemsTable)
      .set({
        ...(parsed.data.modifierGroups !== undefined && { modifierGroups: parsed.data.modifierGroups }),
        ...(parsed.data.categoryId !== undefined && { categoryId: parsed.data.categoryId }),
        ...(parsed.data.name !== undefined && { name: parsed.data.name.trim() }),
        ...(parsed.data.description !== undefined && {
          description: parsed.data.description?.trim() || null,
        }),
        ...(parsed.data.priceCents !== undefined && { priceCents: parsed.data.priceCents }),
        ...(parsed.data.isAvailable !== undefined && { isAvailable: parsed.data.isAvailable }),
      })
      .where(
        and(
          eq(menuItemsTable.id, params.data.menuItemId),
          eq(menuItemsTable.restaurantId, restaurant.id),
        ),
      )
      .returning();
    if (!item) {
      res.status(404).json({ error: "Menu item not found" });
      return;
    }
    res.json(UpdateMyRestaurantMenuItemResponse.parse(item));
  },
);

router.delete(
  "/restaurants/me/menu-items/:menuItemId",
  requireAuth,
  async (req, res): Promise<void> => {
    const profile = await getActiveProfile(req, res);
    if (!profile || !requireRole(profile, ["restaurant"], res)) return;
    const params = DeleteMyRestaurantMenuItemParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: "Invalid menu item id" });
      return;
    }
    const [restaurant] = await db
      .select({ id: restaurantsTable.id })
      .from(restaurantsTable)
      .where(eq(restaurantsTable.ownerProfileId, profile.id))
      .limit(1);
    if (!restaurant) {
      res.status(404).json({ error: "Restaurant profile has not been created" });
      return;
    }
    const [item] = await db
      .delete(menuItemsTable)
      .where(
        and(
          eq(menuItemsTable.id, params.data.menuItemId),
          eq(menuItemsTable.restaurantId, restaurant.id),
        ),
      )
      .returning({ id: menuItemsTable.id });
    if (!item) {
      res.status(404).json({ error: "Menu item not found" });
      return;
    }
    res.sendStatus(204);
  },
);

export default router;