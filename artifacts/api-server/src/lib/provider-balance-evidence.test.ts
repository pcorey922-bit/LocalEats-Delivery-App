import { test } from 'node:test';
import assert from 'node:assert/strict';
import { balanceProof, readPaymentEvidence, verifiedBalance, ProviderEvidenceError } from './provider-balance-evidence';

const balance = { object: 'balance_transaction' as const, balance_type: 'payments' as const, created: 1794528000, description: null, exchange_rate: null, fee_details: [], reporting_category: 'charge', id: 'txn_fixture', source: 'ch_fixture', type: 'charge' as const, amount: 1919, fee: 86, net: 1833, currency: 'usd', status: 'available' as const, available_on: 1794873600 };
const charge = { id: 'ch_fixture', amount: 1919, paid: true, currency: 'usd', livemode: false, payment_intent: 'pi_fixture', balance_transaction: balance };
const payment = { id: 'pi_fixture', amount_received: 1919, currency: 'usd', livemode: false, status: 'succeeded', latest_charge: charge };
function reader(p: unknown = payment, ch: unknown = charge, b: unknown = balance) {
  const calls: string[] = [];
  const api = {
    paymentIntents: { retrieve: async (id: string) => { calls.push(`GET payment_intent ${id}`); return p; } },
    charges: { retrieve: async (id: string) => { calls.push(`GET charge ${id}`); return ch; } },
    balanceTransactions: { retrieve: async (id: string) => { calls.push(`GET balance_transaction ${id}`); return b; } },
  } as unknown as Parameters<typeof readPaymentEvidence>[1];
  return { api, calls };
}
function code(expected: string) {
  return (error: unknown) => error instanceof ProviderEvidenceError && error.status === 409 && error.code === expected;
}
test('realistic expanded Stripe evidence preserves exact gross, fee and net with GET only', async () => {
  const r = reader(), proof = await readPaymentEvidence('pi_fixture', r.api);
  assert.equal(proof.balance.amountCents, 1919);
  assert.equal(proof.balance.feeCents, 86);
  assert.equal(proof.balance.netCents, 1833);
  assert.deepEqual(r.calls, ['GET payment_intent pi_fixture']);
});
test('unexpanded charge and balance IDs resolve only their exact referenced objects', async () => {
  const r = reader({ ...payment, latest_charge: charge.id }, { ...charge, balance_transaction: balance.id });
  assert.equal((await readPaymentEvidence('pi_fixture', r.api)).balance.id, balance.id);
  assert.deepEqual(r.calls, ['GET payment_intent pi_fixture', 'GET charge ch_fixture', 'GET balance_transaction txn_fixture']);
  await assert.rejects(() => readPaymentEvidence('pi_fixture', reader({ ...payment, latest_charge: charge.id }, { ...charge, id: 'ch_other' }).api), code('STRIPE_BALANCE_INVALID'));
  await assert.rejects(() => readPaymentEvidence('pi_fixture', reader({ ...payment, latest_charge: { ...charge, balance_transaction: balance.id } }, charge, { ...balance, id: 'txn_other' }).api), code('STRIPE_BALANCE_INVALID'));
});
test('pending settlement stays blocked even after its reported availability date', async () => {
  for (const available_on of [1, balance.available_on]) {
    const r = reader({ ...payment, latest_charge: { ...charge, balance_transaction: { ...balance, status: 'pending', available_on } } });
    await assert.rejects(() => readPaymentEvidence('pi_fixture', r.api), error => {
      assert.ok(code('STRIPE_BALANCE_PENDING')(error));
      assert.equal((error as ProviderEvidenceError).availableOn, new Date(available_on * 1000).toISOString());
      return true;
    });
  }
  assert.throws(() => verifiedBalance({ ...balanceProof(balance), status: 'pending' }), code('STRIPE_BALANCE_PENDING'));
});
test('missing asynchronous balance evidence is distinct from pending or invalid data', async () => {
  for (const latest_charge of [null, { ...charge, balance_transaction: null }])
    await assert.rejects(() => readPaymentEvidence('pi_fixture', reader({ ...payment, latest_charge }).api), code('STRIPE_BALANCE_MISSING'));
});
test('invalid source, currency, arithmetic, status or cents never become settlement waits', () => {
  for (const patch of [{ source: null }, { currency: 'eur' }, { net: 1 }, { status: 'unknown' }, { amount: 1919.5 }, { fee: Number.NaN }]) {
    for (const status of ['available', 'pending'])
      assert.throws(() => balanceProof({ ...balance, status, ...patch } as any), code('STRIPE_BALANCE_INVALID'));
  }
});
