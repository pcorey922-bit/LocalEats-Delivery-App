import { useEffect, useId, useRef, useState, type FormEvent } from 'react';

export type MenuItemDetails = { name: string; description: string; priceCents: number };

/** Edit only these fields: inventory, visibility and modifier groups have separate controls. */
export function MenuItemEditor({ item, categoryName, onSave, onCancel }: {
  item?: { name: string; description: string | null; priceCents: number };
  categoryName: string;
  onSave: (details: MenuItemDetails) => Promise<unknown>;
  onCancel: () => void;
}) {
  const id = useId();
  const nameInput = useRef<HTMLInputElement>(null);
  const submitting = useRef(false);
  const [name, setName] = useState(item?.name ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [price, setPrice] = useState(item ? (item.priceCents / 100).toFixed(2) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { nameInput.current?.focus(); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    // Parse decimal dollars explicitly. Do not round fractional cents, accept
    // exponents, or let Number('') silently turn an empty price into a free item.
    const amount = price.trim();
    if (!name.trim() || !/^\d+(?:\.\d{1,2})?$/.test(amount)) {
      setError('Enter an item name and a price in dollars with at most two decimal places.');
      return;
    }
    const [dollars, cents = ''] = amount.split('.');
    const priceCents = Number(dollars) * 100 + Number(cents.padEnd(2, '0'));
    if (!Number.isSafeInteger(priceCents) || priceCents > 1_000_000) {
      setError('Price must be between $0.00 and $10,000.00.');
      return;
    }
    submitting.current = true;
    setSaving(true);
    setError('');
    try {
      await onSave({ name: name.trim(), description: description.trim(), priceCents });
    } catch {
      setError('We could not confirm the save. Your changes are still here. Check your connection and account access, and check the menu before retrying to avoid creating a duplicate item.');
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  return <section className="roco-card" aria-labelledby={`${id}-heading`}>
    <h2 id={`${id}-heading`}>{item ? 'Edit menu item' : 'Add menu item'}</h2>
    <p>Category: {categoryName}. Changes apply to future orders; existing orders keep their original details.</p>
    <form className="roco-form-grid" onSubmit={submit} aria-busy={saving}>
      <fieldset disabled={saving} className="full" style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
        <label className="roco-field">Item name<input ref={nameInput} className="roco-input" required maxLength={140} value={name} onChange={e => setName(e.target.value)} /></label>
        <div className="roco-field"><label htmlFor={`${id}-description`}>Description (optional)</label><textarea id={`${id}-description`} className="roco-textarea" maxLength={2000} value={description} onChange={e => setDescription(e.target.value)} /></div>
        <label className="roco-field">Price in dollars<input className="roco-input" type="text" inputMode="decimal" required maxLength={12} value={price} onChange={e => setPrice(e.target.value)} aria-describedby={`${id}-price-help`} /></label>
        <p id={`${id}-price-help`}>Use dollars and cents, such as 8.99. Enter 0.00 only for an intentionally free item.</p>
        {error && <p className="roco-alert" role="alert">{error}</p>}
        <div className="roco-row"><button className="roco-button primary" type="submit">{saving ? 'Saving item…' : 'Save item'}</button><button className="roco-button" type="button" onClick={onCancel}>Cancel editing</button></div>
      </fieldset>
    </form>
  </section>;
}
