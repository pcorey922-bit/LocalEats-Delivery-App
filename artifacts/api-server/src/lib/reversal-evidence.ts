import {CommerceError} from './commerce-policy';
export class ReversalEvidenceError extends CommerceError {
 readonly requiresReconciliation=true;
 constructor(){super(409,'Provider reversal evidence does not match the committed full recovery. Keep this operation held for review.');}
}
export type ReversalExpectation={amountCents:number;transferId:string;orderId:string;operationId:string};
const object=(value:unknown):Record<string,unknown>|undefined=>value!==null && typeof value==='object' && !Array.isArray(value)?value as Record<string,unknown>:undefined;
export function verifiedReversalReceipt(value:unknown,expected:ReversalExpectation):{id:string;status:'succeeded'} {
 const receipt=object(value),transfer=object(receipt?.transfer),metadata=object(receipt?.metadata);
 const transferId=typeof receipt?.transfer==='string'?receipt.transfer:transfer?.id;
 if(!Number.isSafeInteger(expected.amountCents) || expected.amountCents<=0 || !expected.transferId || typeof receipt?.id!=='string' || !/^trr_[A-Za-z0-9_]+$/.test(receipt.id) || receipt.amount!==expected.amountCents || receipt.currency!=='usd' || transferId!==expected.transferId || receipt.livemode===true || transfer?.livemode===true || metadata?.operationId!==expected.operationId || metadata?.orderId!==expected.orderId) throw new ReversalEvidenceError();
 return {id:receipt.id,status:'succeeded'};
}
