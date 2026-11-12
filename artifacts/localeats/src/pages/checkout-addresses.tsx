import { useState, type FormEvent } from 'react';
import { Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateMyAddress, type Address } from '@workspace/api-client-react';
import { accountStatus } from '../lib/account-entry';

function errorMessage(error: unknown, guest: boolean, saving = false) {
  if (accountStatus(error) === 401) return guest
    ? 'Your guest access is missing or expired. Reopen your private guest link before continuing.'
    : 'Your sign-in session could not be verified. Check account access or sign in again, then retry.';
  if (accountStatus(error) === 403) return 'This account cannot access delivery addresses. Check your customer account and private staging invitation.';
  if (accountStatus(error) === 400) return 'The address could not be saved. Check the street, city, state and ZIP code.';
  return saving ? 'Your address could not be saved. Check your connection and retry.' : 'Your saved delivery addresses could not be loaded. Check your connection and retry.';
}

export function CheckoutAddresses({ addresses, pending, error, retry, selectedId, onSelect, queryKey, guest }: {
  addresses: Address[] | undefined;
  pending: boolean;
  error: unknown;
  retry: () => void;
  selectedId: string;
  onSelect: (id: string) => void;
  queryKey: readonly unknown[];
  guest: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const client = useQueryClient();
  const create = useCreateMyAddress();
  const unauthorized = [401, 403].includes(accountStatus(error) ?? 0);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (create.isPending) return;
    const form = new FormData(event.currentTarget);
    create.mutate({ data: {
      label: String(form.get('label') || 'Home').trim(),
      street1: String(form.get('street1')).trim(), street2: String(form.get('street2') || '').trim(),
      city: String(form.get('city')).trim(), region: String(form.get('region') || 'TN').trim(),
      postalCode: String(form.get('postalCode')).trim(), deliveryInstructions: String(form.get('deliveryInstructions') || '').trim(),
      isDefault: form.get('isDefault') === 'on',
    } }, { onSuccess: async address => {
      // A pending list response must not overwrite this successfully saved address.
      await client.cancelQueries({ queryKey });
      client.setQueryData<Address[]>(queryKey, previous => [
        ...(previous ?? []).filter(a => a.id !== address.id).map(a => address.isDefault ? { ...a, isDefault: false } : a), address,
      ]);
      onSelect(address.id);
      setShowForm(false);
      void client.invalidateQueries({ queryKey });
    } });
  };
  return <div role="group" aria-label="Address book" aria-busy={pending}>
    {pending ? <p role="status">Loading saved addresses…</p> : error ? <div className="roco-alert" role="alert">
      <p>{errorMessage(error, guest)}</p>
      <button className="roco-button" type="button" onClick={retry}>Retry addresses</button>{' '}
      <Link href={guest ? '/guest/order' : '/account/access?join=customer&checkout=1'}>{guest ? 'Recover guest access' : 'Check account access'}</Link>
    </div> : addresses?.length ? <label className="roco-field">Delivery address
      <select aria-label="Delivery address" className="roco-select" value={selectedId} onChange={event => onSelect(event.target.value)}>
        <option value="">Choose a saved address</option>
        {addresses.map(address => <option key={address.id} value={address.id}>{address.label ? `${address.label} — ` : ''}{address.street1}, {address.city} {address.postalCode}</option>)}
      </select>
    </label> : <p>No saved delivery addresses. Add one to continue.</p>}
    {!unauthorized && <button className="roco-button" type="button" disabled={showForm} onClick={() => { create.reset(); setShowForm(true); }}>Add address</button>}
    {create.isSuccess && !showForm && <p role="status">Address saved.</p>}
    {showForm && !unauthorized && <form className="roco-form-grid roco-address-form" onSubmit={submit}>
      <label className="roco-field">Label<input name="label" className="roco-input" defaultValue="Home" maxLength={60}/></label>
      <label className="roco-field">Street address<input required minLength={2} maxLength={180} name="street1" autoComplete="shipping address-line1" className="roco-input"/></label>
      <label className="roco-field">Apartment / unit (optional)<input maxLength={180} name="street2" autoComplete="shipping address-line2" className="roco-input"/></label>
      <label className="roco-field">City<input required minLength={2} maxLength={100} name="city" autoComplete="shipping address-level2" className="roco-input"/></label>
      <label className="roco-field">State<input required maxLength={80} name="region" autoComplete="shipping address-level1" className="roco-input" defaultValue="TN"/></label>
      <label className="roco-field">ZIP code<input required minLength={3} maxLength={20} name="postalCode" autoComplete="shipping postal-code" inputMode="numeric" className="roco-input"/></label>
      <label className="roco-field full">Delivery instructions<textarea name="deliveryInstructions" className="roco-input" maxLength={1000}/></label>
      <label className="roco-field roco-address-default"><input type="checkbox" name="isDefault"/> Set as default address</label>
      <div className="roco-row"><button className="roco-button primary" disabled={create.isPending}>{create.isPending ? 'Saving address…' : 'Save address'}</button><button className="roco-button" type="button" disabled={create.isPending} onClick={() => setShowForm(false)}>Cancel address</button></div>
      {create.isError && <p className="roco-alert full" role="alert">{errorMessage(create.error, guest, true)}</p>}
    </form>}
  </div>;
}
