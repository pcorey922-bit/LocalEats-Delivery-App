import { requireCustomerAuth } from "../lib/guest-access";
import { and, asc, eq, ne } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateMyAddressBody,
  CreateMyAddressResponse,
  DeleteMyAddressParams,
  ListMyAddressesResponse,
  UpdateMyAddressBody,
  UpdateMyAddressParams,
  UpdateMyAddressResponse,
} from "@workspace/api-zod";
import { addressesTable, db } from "@workspace/db";
import { getActiveProfile, requireRole } from "../lib/current-profile";
import { requireAuth } from "../middlewares/require-auth";

const router: IRouter = Router();

function addressValues(
  data: {
    label?: string;
    street1?: string;
    street2?: string | null;
    city?: string;
    region?: string;
    postalCode?: string;
    deliveryInstructions?: string | null;
    isDefault?: boolean;
  },
) {
  return {
    ...(data.label !== undefined && { label: data.label.trim() || "Home" }),
    ...(data.street1 !== undefined && { street1: data.street1.trim() }),
    ...(data.street2 !== undefined && { street2: data.street2?.trim() || null }),
    ...(data.city !== undefined && { city: data.city.trim() }),
    ...(data.region !== undefined && { region: data.region.trim() || "Tennessee" }),
    ...(data.postalCode !== undefined && { postalCode: data.postalCode.trim() }),
    ...(data.deliveryInstructions !== undefined && {
      deliveryInstructions: data.deliveryInstructions?.trim() || null,
    }),
    ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
  };
}

function hasBlankRequiredField(data: {
  street1?: string;
  city?: string;
  postalCode?: string;
}) {
  return (
    (data.street1 !== undefined && !data.street1.trim()) ||
    (data.city !== undefined && !data.city.trim()) ||
    (data.postalCode !== undefined && !data.postalCode.trim())
  );
}

router.get("/addresses/me", requireCustomerAuth, async (req, res): Promise<void> => {
  const profile = await getActiveProfile(req, res);
  if (!profile || !requireRole(profile, ["customer"], res)) return;

  const addresses = await db
    .select()
    .from(addressesTable)
    .where(eq(addressesTable.profileId, profile.id))
    .orderBy(asc(addressesTable.isDefault), asc(addressesTable.createdAt));

  res.json(ListMyAddressesResponse.parse(addresses.reverse()));
});

router.post("/addresses/me", requireCustomerAuth, async (req, res): Promise<void> => {
  const profile = await getActiveProfile(req, res);
  if (!profile || !requireRole(profile, ["customer"], res)) return;

  const parsed = CreateMyAddressBody.safeParse(req.body);
  if (!parsed.success || hasBlankRequiredField(parsed.data ?? {})) {
    res.status(400).json({ error: "Enter a valid delivery address" });
    return;
  }

  const fields = addressValues(parsed.data);
  const [created] = await db.transaction(async (tx) => {
    const existing = await tx
      .select({ id: addressesTable.id })
      .from(addressesTable)
      .where(eq(addressesTable.profileId, profile.id))
      .limit(1);
    const shouldBeDefault = parsed.data.isDefault === true || existing.length === 0;

    if (shouldBeDefault) {
      await tx
        .update(addressesTable)
        .set({ isDefault: false })
        .where(eq(addressesTable.profileId, profile.id));
    }

    return tx
      .insert(addressesTable)
      .values({
        profileId: profile.id,
        label: fields.label ?? "Home",
        street1: fields.street1!,
        street2: fields.street2 ?? null,
        city: fields.city!,
        region: fields.region ?? "Tennessee",
        postalCode: fields.postalCode!,
        deliveryInstructions: fields.deliveryInstructions ?? null,
        isDefault: shouldBeDefault,
      })
      .returning();
  });

  res.status(201).json(CreateMyAddressResponse.parse(created));
});

router.patch(
  "/addresses/me/:addressId",
  requireCustomerAuth,
  async (req, res): Promise<void> => {
    const profile = await getActiveProfile(req, res);
    if (!profile || !requireRole(profile, ["customer"], res)) return;

    const params = UpdateMyAddressParams.safeParse(req.params);
    const parsed = UpdateMyAddressBody.safeParse(req.body);
    if (!params.success || !parsed.success || Object.keys(parsed.data ?? {}).length === 0) {
      res.status(400).json({ error: "Enter a valid address update" });
      return;
    }
    if (hasBlankRequiredField(parsed.data)) {
      res.status(400).json({ error: "Street, city, and postal code cannot be blank" });
      return;
    }

    const fields = addressValues(parsed.data);
    const updated = await db.transaction(async (tx) => {
      const [owned] = await tx
        .select({ id: addressesTable.id })
        .from(addressesTable)
        .where(
          and(
            eq(addressesTable.id, params.data.addressId),
            eq(addressesTable.profileId, profile.id),
          ),
        )
        .limit(1);
      if (!owned) return null;

      if (parsed.data.isDefault === true) {
        await tx
          .update(addressesTable)
          .set({ isDefault: false })
          .where(
            and(
              eq(addressesTable.profileId, profile.id),
              ne(addressesTable.id, params.data.addressId),
            ),
          );
      }

      const [address] = await tx
        .update(addressesTable)
        .set(fields)
        .where(
          and(
            eq(addressesTable.id, params.data.addressId),
            eq(addressesTable.profileId, profile.id),
          ),
        )
        .returning();
      return address ?? null;
    });

    if (!updated) {
      res.status(404).json({ error: "Address not found" });
      return;
    }

    res.json(UpdateMyAddressResponse.parse(updated));
  },
);

router.delete(
  "/addresses/me/:addressId",
  requireCustomerAuth,
  async (req, res): Promise<void> => {
    const profile = await getActiveProfile(req, res);
    if (!profile || !requireRole(profile, ["customer"], res)) return;
    const params = DeleteMyAddressParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: "Invalid address id" });
      return;
    }

    const deleted = await db.transaction(async (tx) => {
      const [owned] = await tx
        .select()
        .from(addressesTable)
        .where(
          and(
            eq(addressesTable.id, params.data.addressId),
            eq(addressesTable.profileId, profile.id),
          ),
        )
        .limit(1);
      if (!owned) return false;

      await tx
        .delete(addressesTable)
        .where(
          and(
            eq(addressesTable.id, owned.id),
            eq(addressesTable.profileId, profile.id),
          ),
        );

      if (owned.isDefault) {
        const [nextAddress] = await tx
          .select({ id: addressesTable.id })
          .from(addressesTable)
          .where(eq(addressesTable.profileId, profile.id))
          .orderBy(asc(addressesTable.createdAt))
          .limit(1);
        if (nextAddress) {
          await tx
            .update(addressesTable)
            .set({ isDefault: true })
            .where(eq(addressesTable.id, nextAddress.id));
        }
      }
      return true;
    });

    if (!deleted) {
      res.status(404).json({ error: "Address not found" });
      return;
    }
    res.sendStatus(204);
  },
);

export default router;