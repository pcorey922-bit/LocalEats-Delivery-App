import { z } from 'zod';
import type Stripe from 'stripe';
import { CommerceError } from './commerce-policy';

export type EvidenceCode = 'STRIPE_BALANCE_PENDING' | 'STRIPE_BALANCE_MISSING' | 'STRIPE_BALANCE_INVALID';
export class ProviderEvidenceError extends CommerceError {
  constructor(public readonly code: EvidenceCode, message: string, public readonly availableOn?: string) {
    super(409, message);
  }
}
const cents = z.number().int().min(-2147483647).max(2147483647);
const fields = {
  id: z.string().min(1), sourceId: z.string().min(1), kind: z.string().min(1),
  amountCents: cents, feeCents: cents, netCents: cents, currency: z.literal('usd'),
};
export const balanceProofSchema = z.object({ ...fields, status: z.literal('available') }).strict()
  .refine(b => b.netCents === b.amountCents - b.feeCents, 'Provider balance arithmetic mismatch');
const pendingProofSchema = z.object({ ...fields, status: z.literal('pending') }).strict()
  .refine(b => b.netCents === b.amountCents - b.feeCents);
export type BalanceProof = z.infer<typeof balanceProofSchema>;

export function verifiedBalance(value: unknown, availableOn?: number): BalanceProof {
  const result = balanceProofSchema.safeParse(value);
  if (result.success) return result.data;
  if (pendingProofSchema.safeParse(value).success) {
    // The provider's availability date is informational. Never infer settled
    // status from the clock or record pending funds as available evidence.
    const date = Number.isSafeInteger(availableOn) && availableOn! > 0 && availableOn! <= 253402300799
      ? new Date(availableOn! * 1000).toISOString() : undefined;
    throw new ProviderEvidenceError('STRIPE_BALANCE_PENDING',
      'Stripe balance funds are pending. Reconciliation is not complete; retry when Stripe reports available. Payment and delivery are unchanged.', date);
  }
  throw new ProviderEvidenceError('STRIPE_BALANCE_INVALID',
    'Stripe balance evidence is invalid or inconsistent. Review the existing transaction in Stripe before retrying. No reconciliation evidence was recorded.');
}
export function balanceProof(b: Stripe.BalanceTransaction): BalanceProof {
  return verifiedBalance({
    id: b.id, sourceId: typeof b.source === 'string' ? b.source : b.source?.id,
    kind: b.type, amountCents: b.amount, feeCents: b.fee, netCents: b.net,
    currency: b.currency, status: b.status,
  }, b.available_on);
}
export type PaymentProof = {
  id: string; amountReceived: number; currency: string; livemode: boolean; status: string;
  chargeId: string; chargePaymentId: string; chargeAmount: number; chargePaid: boolean; balance: BalanceProof;
};
type Reader = Pick<Stripe, 'paymentIntents' | 'charges' | 'balanceTransactions'>;
export async function readPaymentEvidence(id: string, stripe: Reader): Promise<PaymentProof> {
  const payment = await stripe.paymentIntents.retrieve(id, { expand: ['latest_charge.balance_transaction'] });
  // Expansions can be absent or represented as IDs. Resolve only those IDs
  // returned by Stripe, using GET requests; never search for a substitute charge.
  const charge = typeof payment.latest_charge === 'string'
    ? await stripe.charges.retrieve(payment.latest_charge, { expand: ['balance_transaction'] })
    : payment.latest_charge;
  if (!charge || !charge.balance_transaction)
    throw new ProviderEvidenceError('STRIPE_BALANCE_MISSING',
      'Stripe has not supplied the charge balance transaction yet. Reconciliation is not complete. Review this existing payment in Stripe and retry later.');
  if (typeof payment.latest_charge === 'string' && charge.id !== payment.latest_charge)
    throw new ProviderEvidenceError('STRIPE_BALANCE_INVALID', 'Stripe returned a different charge than the recorded payment references.');
  const balance = typeof charge.balance_transaction === 'string'
    ? await stripe.balanceTransactions.retrieve(charge.balance_transaction)
    : charge.balance_transaction;
  if (typeof charge.balance_transaction === 'string' && balance.id !== charge.balance_transaction)
    throw new ProviderEvidenceError('STRIPE_BALANCE_INVALID', 'Stripe returned a different balance transaction than the charge references.');
  return {
    id: payment.id, amountReceived: payment.amount_received, currency: payment.currency,
    livemode: payment.livemode, status: payment.status, chargeId: charge.id,
    chargePaymentId: typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id ?? '',
    chargeAmount: charge.amount, chargePaid: charge.paid, balance: balanceProof(balance),
  };
}
