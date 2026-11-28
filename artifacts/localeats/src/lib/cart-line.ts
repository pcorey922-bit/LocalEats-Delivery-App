// A different preparation request must remain a separate kitchen order line.
export function cartLineKey(
  menuItemId: string,
  modifiers: Record<string, string[]> = {},
  instructions = "",
) {
  return JSON.stringify([
    menuItemId,
    Object.entries(modifiers)
      .filter(([, options]) => options.length > 0)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([group, options]) => [group, [...options].sort()]),
    instructions.trim(),
  ]);
}
