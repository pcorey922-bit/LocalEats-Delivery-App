import { useEffect, useRef, useState, type FormEvent } from 'react';

export function MenuCategoryEditor({ name: initialName, onSave, onCancel }: {
  name?: string;
  onSave: (name: string) => Promise<unknown>;
  onCancel: () => void;
}) {
  const input = useRef<HTMLInputElement>(null), submitting = useRef(false);
  const [name, setName] = useState(initialName ?? '');
  const [saving, setSaving] = useState(false), [error, setError] = useState('');
  useEffect(() => { input.current?.focus(); }, []);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    if (!name.trim()) { setError('Enter a category name.'); return; }
    submitting.current = true;
    setSaving(true);
    setError('');
    try { await onSave(name.trim()); }
    catch { setError('We could not confirm the save. Your name is still here. Check your connection and account access, and check the menu before retrying.'); }
    finally { submitting.current = false; setSaving(false); }
  }
  return <section className="roco-card" aria-label={initialName === undefined ? 'Add menu category' : 'Rename menu category'}>
    <h2>{initialName === undefined ? 'Add menu category' : 'Rename menu category'}</h2>
    <form onSubmit={submit} aria-busy={saving}>
      <label className="roco-field">Category name<input ref={input} className="roco-input" required maxLength={100} disabled={saving} value={name} onChange={e => setName(e.target.value)} /></label>
      {error && <p className="roco-alert" role="alert">{error}</p>}
      <div className="roco-row"><button className="roco-button primary" disabled={saving}>{saving ? 'Saving category…' : 'Save category'}</button><button className="roco-button" type="button" disabled={saving} onClick={onCancel}>Cancel editing</button></div>
    </form>
  </section>;
}
