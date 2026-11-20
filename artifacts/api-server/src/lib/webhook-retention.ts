import {createHash} from 'node:crypto';
import {and,asc,eq,inArray,isNull,lt,notExists,sql} from 'drizzle-orm';
import {db,webhookInboxTable as inbox,ordersTable,paymentsTable,financialHoldsTable,financialOperationsTable} from '@workspace/db';
import {databaseNow} from './database-clock';
import {audit} from './commerce';
const retentionMs=30*24*60*60*1000;
const supported=['checkout.session.completed','checkout.session.async_payment_succeeded'];
const record=(value:unknown):Record<string,unknown>|undefined=>value!==null && typeof value==='object' && !Array.isArray(value)?value as Record<string,unknown>:undefined;
function canonical(value:unknown):unknown {
 if(Array.isArray(value))return value.map(canonical);
 const obj=record(value);if(obj)return Object.fromEntries(Object.keys(obj).sort().map(k=>[k,canonical(obj[k])]));return value;
}
export function retainedCheckoutReceipt(payload:Record<string,unknown>,id:string,eventType:string,compactedAt:Date) {
 const obj=record(record(payload.data)?.object), metadata=record(obj?.metadata);
 if(payload.id!==id || payload.type!==eventType || payload.livemode!==false || !supported.includes(eventType) || typeof obj?.id!=='string' || !/^cs_[A-Za-z0-9_]+$/.test(obj.id) || typeof metadata?.orderId!=='string' || !/^[a-f0-9-]{36}$/i.test(metadata.orderId))return;
 const retained:Record<string,unknown>={id:obj.id,object:'checkout.session',metadata:{orderId:metadata.orderId}};
 for(const key of ['amount_total','amount_subtotal']) if(Number.isSafeInteger(obj[key]) && Number(obj[key])>=0)retained[key]=obj[key];
 if(typeof obj.currency==='string' && /^[a-z]{3}$/.test(obj.currency))retained.currency=obj.currency;
 for(const key of ['payment_intent','charge']) {
  const raw=typeof obj[key]==='string'?obj[key]:record(obj[key])?.id;
  if(typeof raw==='string' && /^(pi|ch)_[A-Za-z0-9_]+$/.test(raw))retained[key]=raw;
 }
 for(const key of ['status','payment_status'])if(typeof obj[key]==='string' && ['complete','paid','unpaid','no_payment_required'].includes(obj[key] as string))retained[key]=obj[key];
 return {id,type:eventType,livemode:false,...(Number.isSafeInteger(payload.created)?{created:payload.created}:{}),data:{object:retained},rocoeatsRetention:{policy:'processed-checkout-30d-v1',compactedAt:compactedAt.toISOString(),payloadSha256:createHash('sha256').update(JSON.stringify(canonical(payload))).digest('hex')}};
}
// Explicit owner-approved opt-in only. No records are deleted, and no provider I/O.
export async function compactProcessedCheckoutWebhooks(env=process.env) {
 if(env.ROCOEATS_WEBHOOK_RETENTION_ENABLED!=='true')return 0;
 const cutoff=new Date((await databaseNow()).getTime()-retentionMs);
 const eligible=(executor:Pick<typeof db,'select'>,id?:string)=>executor.select({event:inbox,orderId:ordersTable.id})
  .from(inbox)
  .innerJoin(ordersTable,sql`${ordersTable.id}::text = (${inbox.payload} #>> '{data,object,metadata,orderId}')`)
  .innerJoin(paymentsTable,and(eq(paymentsTable.orderId,ordersTable.id),eq(paymentsTable.provider,'stripe_test'),inArray(paymentsTable.status,['succeeded','refunded']),sql`${paymentsTable.checkoutSessionId} = (${inbox.payload} #>> '{data,object,id}')`,sql`${paymentsTable.providerPaymentId} = coalesce((${inbox.payload} #>> '{data,object,payment_intent,id}'),(${inbox.payload} #>> '{data,object,payment_intent}'))`,sql`${paymentsTable.amountCents}::text = (${inbox.payload} #>> '{data,object,amount_total}')`,sql`(${inbox.payload} #>> '{data,object,currency}') = 'usd'`,sql`(${inbox.payload} #>> '{data,object,payment_status}') = 'paid'`))
  .where(and(id?eq(inbox.id,id):undefined,eq(inbox.state,'processed'),lt(inbox.processedAt,cutoff),isNull(inbox.leaseToken),isNull(inbox.leaseExpiresAt),inArray(inbox.eventType,supported),sql`NOT (${inbox.payload} ? 'rocoeatsRetention')`,
   notExists(executor.select({id:financialHoldsTable.id}).from(financialHoldsTable).where(and(eq(financialHoldsTable.orderId,ordersTable.id),eq(financialHoldsTable.active,true)))),
   notExists(executor.select({id:financialOperationsTable.id}).from(financialOperationsTable).where(and(eq(financialOperationsTable.orderId,ordersTable.id),inArray(financialOperationsTable.state,['queued','pending','processing','reconciliation','failed']))))));
 const candidates=await eligible(db).orderBy(asc(inbox.processedAt)).limit(25);
 let compacted=0;
 for(const candidate of candidates) {
  compacted+=await db.transaction(async tx=>{
   // Order before event: fence concurrent financial recovery and avoid lock inversion.
   const [order]=await tx.select({id:ordersTable.id}).from(ordersTable).where(eq(ordersTable.id,candidate.orderId)).for('update',{skipLocked:true});if(!order)return 0;
   const [current]=await eligible(tx,candidate.event.id).for('update',{of:inbox,skipLocked:true}).limit(1);if(!current)return 0;
   const receipt=retainedCheckoutReceipt(current.event.payload,current.event.id,current.event.eventType,await databaseNow(tx));if(!receipt)return 0;
   await tx.update(inbox).set({payload:receipt}).where(eq(inbox.id,current.event.id));
   await audit(tx,null,'webhook.payload_compacted',current.event.id,{policy:receipt.rocoeatsRetention.policy,payloadSha256:receipt.rocoeatsRetention.payloadSha256});
   return 1;
  });
 }
 return compacted;
}
