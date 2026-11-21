import {sql} from 'drizzle-orm';import {pgTable,uuid,integer,text,timestamp,index,check} from 'drizzle-orm/pg-core';
import {ordersTable} from './orders';import {profilesTable} from './profiles';
export const partialRefundsTable=pgTable('partial_refunds',{
 id:uuid('id').primaryKey(),orderId:uuid('order_id').notNull().references(()=>ordersTable.id),amountCents:integer('amount_cents').notNull(),
 fundingPolicy:text('funding_policy').notNull().default('platform_goodwill_v1'),status:text('status').notNull().default('pending'),providerRefundId:text('provider_refund_id').unique(),actorProfileId:uuid('actor_profile_id').notNull().references(()=>profilesTable.id),reason:text('reason').notNull(),createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow(),
},t=>[index('partial_refunds_order_idx').on(t.orderId,t.createdAt),check('partial_refunds_amount_cents_check',sql`${t.amountCents}>0`),check('partial_refunds_funding_policy_check',sql`${t.fundingPolicy}='platform_goodwill_v1'`),check('partial_refunds_status_check',sql`${t.status} IN ('pending','requires_action','succeeded','failed','canceled')`)]);
