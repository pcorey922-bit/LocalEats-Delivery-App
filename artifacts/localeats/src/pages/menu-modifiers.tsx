import { useState } from "react";
import {
  customize,
  ModifierGroupsSchema,
  type ModifierGroup,
} from "../../../../lib/api-zod/src/modifiers";
import { customFetch } from "../../../../lib/api-client-react/src/custom-fetch";
export function ModifierEditor({
  itemId,
  groups = [],
  reload,
}: {
  itemId: string;
  groups?: ModifierGroup[];
  reload: () => void;
}) {
  const [open, setOpen] = useState(false),
    [draft, setDraft] = useState(groups),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false);
  const change = (index: number, value: Partial<ModifierGroup>) =>
    setDraft((d) => d.map((g, i) => (i === index ? { ...g, ...value } : g)));
  return (
    <div>
      <button
        className="roco-button"
        onClick={() => {
          setDraft(groups);
          setOpen(!open);
        }}
      >
        Customize modifiers
      </button>
      {open && (
        <section className="roco-card">
          <h3>Modifier groups</h3>
          {draft.map((g, i) => (
            <fieldset key={g.id}>
              <legend>Group {i + 1}</legend>
              <label>
                Name
                <input
                  value={g.name}
                  onChange={(e) => change(i, { name: e.target.value })}
                />
              </label>
              <label>
                Minimum selections (0 means optional)
                <input
                  type="number"
                  min="0"
                  value={g.minSelections}
                  onChange={(e) =>
                    change(i, { minSelections: Number(e.target.value) })
                  }
                />
              </label>
              <label>
                Maximum selections
                <input
                  type="number"
                  min="1"
                  value={g.maxSelections}
                  onChange={(e) =>
                    change(i, { maxSelections: Number(e.target.value) })
                  }
                />
              </label>
              {g.options.map((o, j) => (
                <div key={o.id}>
                  <label>
                    Option name
                    <input
                      value={o.name}
                      onChange={(e) =>
                        change(i, {
                          options: g.options.map((x, k) =>
                            k === j ? { ...x, name: e.target.value } : x,
                          ),
                        })
                      }
                    />
                  </label>
                  <label>
                    Extra price in cents
                    <input
                      type="number"
                      min="0"
                      value={o.priceCents}
                      onChange={(e) =>
                        change(i, {
                          options: g.options.map((x, k) =>
                            k === j
                              ? { ...x, priceCents: Number(e.target.value) }
                              : x,
                          ),
                        })
                      }
                    />
                  </label>
                  <button
                    onClick={() =>
                      change(i, {
                        options: g.options.filter((_, k) => k !== j),
                      })
                    }
                  >
                    Remove option
                  </button>
                </div>
              ))}
              <button
                onClick={() =>
                  change(i, {
                    options: [
                      ...g.options,
                      { id: crypto.randomUUID(), name: "", priceCents: 0 },
                    ],
                  })
                }
              >
                Add option
              </button>
              <button
                onClick={() => setDraft((d) => d.filter((_, k) => k !== i))}
              >
                Remove group
              </button>
            </fieldset>
          ))}
          <button
            onClick={() =>
              setDraft((d) => [
                ...d,
                {
                  id: crypto.randomUUID(),
                  name: "",
                  minSelections: 0,
                  maxSelections: 1,
                  options: [],
                },
              ])
            }
          >
            Add group
          </button>
          <button
            disabled={saving}
            onClick={async () => {
              const parsed = ModifierGroupsSchema.safeParse(draft);
              if (!parsed.success) {
                setError(parsed.error.issues.map((x) => x.message).join("; "));
                return;
              }
              setSaving(true);
              try {
                await customFetch(`/api/restaurants/me/menu-items/${itemId}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ modifierGroups: parsed.data }),
                });
                reload();
                setOpen(false);
                setError("");
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : "Unable to save modifiers",
                );
              } finally {
                setSaving(false);
              }
            }}
          >
            Save modifiers
          </button>
          {error && <p role="alert">{error}</p>}
        </section>
      )}
    </div>
  );
}
export function CustomizedAdd({
  item,
  onAdd,
}: {
  item: {
    id: string;
    name: string;
    priceCents: number;
    modifierGroups?: ModifierGroup[];
  };
  onAdd: (
    selected: Record<string, string[]>,
    extra: number,
    label: string,
    instructions: string,
  ) => void;
}) {
  const [instructions, setInstructions] = useState("");
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  let extra = 0,
    error = "";
  try {
    extra = customize(item.modifierGroups ?? [], selected).extraCents;
  } catch (e) {
    error = e instanceof Error ? e.message : "Invalid selection";
  }
  return (
    <div>
      {(item.modifierGroups ?? []).map((g) => (
        <fieldset key={g.id}>
          <legend>
            {g.name} ({g.minSelections}–{g.maxSelections})
          </legend>
          {g.options.map((o) => (
            <label key={o.id} style={{ display: "block" }}>
              <input
                type="checkbox"
                checked={(selected[g.id] ?? []).includes(o.id)}
                onChange={(e) =>
                  setSelected((s) => ({
                    ...s,
                    [g.id]: e.target.checked
                      ? [...(s[g.id] ?? []), o.id]
                      : (s[g.id] ?? []).filter((id) => id !== o.id),
                  }))
                }
              />
              {o.name} (+${(o.priceCents / 100).toFixed(2)})
            </label>
          ))}
        </fieldset>
      ))}
      <label>
        Preparation instructions (optional)
        <textarea
          className="roco-input"
          maxLength={500}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />
      </label>
      <p>${((item.priceCents + extra) / 100).toFixed(2)}</p>
      {error && <small>{error}</small>}
      <button
        className="roco-button"
        disabled={!!error}
        onClick={() =>
          onAdd(
            selected,
            extra,
            customize(item.modifierGroups ?? [], selected)
              .snapshot.map((o) => `${o.group}: ${o.option}`)
              .join(", "),
            instructions.trim(),
          )
        }
      >
        Add to cart
      </button>
    </div>
  );
}
