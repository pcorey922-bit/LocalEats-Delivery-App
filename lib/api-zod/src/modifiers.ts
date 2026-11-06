import { z } from "zod/v4";
export const ModifierGroupsSchema = z
  .array(
    z
      .object({
        id: z.string().min(1).max(80),
        name: z.string().trim().min(1).max(100),
        minSelections: z.int().min(0).max(30),
        maxSelections: z.int().min(1).max(30),
        options: z
          .array(
            z.object({
              id: z.string().min(1).max(80),
              name: z.string().trim().min(1).max(100),
              priceCents: z.int().min(0).max(100000),
            }),
          )
          .min(1)
          .max(30),
      })
      .superRefine((g, c) => {
        if (
          g.minSelections > g.maxSelections ||
          g.maxSelections > g.options.length ||
          new Set(g.options.map((o) => o.id)).size !== g.options.length
        )
          c.addIssue({
            code: "custom",
            message: "Invalid selection limits or duplicate option IDs",
          });
      }),
  )
  .max(20)
  .superRefine((gs, c) => {
    if (new Set(gs.map((g) => g.id)).size !== gs.length)
      c.addIssue({ code: "custom", message: "Duplicate group IDs" });
  });
export type ModifierGroup = z.infer<typeof ModifierGroupsSchema>[number];
export function customize(
  groups: ModifierGroup[],
  selected: Record<string, string[]> = {},
) {
  const known = new Set(groups.map((g) => g.id));
  if (Object.keys(selected).some((k) => !known.has(k)))
    throw new Error("Unknown modifier group");
  let extraCents = 0;
  const snapshot: { group: string; option: string; priceCents: number }[] = [];
  for (const g of groups) {
    const ids = selected[g.id] ?? [];
    if (
      !Array.isArray(ids) ||
      new Set(ids).size !== ids.length ||
      ids.length < g.minSelections ||
      ids.length > g.maxSelections
    )
      throw new Error(
        `Choose ${g.minSelections}–${g.maxSelections} options for ${g.name}`,
      );
    for (const id of ids) {
      const option = g.options.find((o) => o.id === id);
      if (!option) throw new Error("Unknown modifier option");
      extraCents += option.priceCents;
      snapshot.push({
        group: g.name,
        option: option.name,
        priceCents: option.priceCents,
      });
    }
  }
  return { extraCents, snapshot };
}
