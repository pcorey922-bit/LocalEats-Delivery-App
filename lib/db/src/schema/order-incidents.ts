import {sql} from 'drizzle-orm';
import {pgTable,uuid,text,integer,timestamp,uniqueIndex,index,check} from 'drizzle-orm/pg-core';
import {ordersTable} from './orders';import {profilesTable} from './profiles';
export const orderIncidentsTable=pgTable('order_incidents',{
 id:uuid('id').primaryKey().defaultRandom(),orderId:uuid('order_id').notNull().references(()=>ordersTable.id),
 kind:text('kind').notNull(),phaseKey:text('phase_key').notNull(),status:text('status').notNull().default('open'),
 version:integer('version').notNull().default(1),note:text('note'),reviewedBy:uuid('reviewed_by').references(()=>profilesTable.id),
 openedAt:timestamp('opened_at',{withTimezone:true}).notNull().defaultNow(),resolvedAt:timestamp('resolved_at',{withTimezone:true}),
},t=>[uniqueIndex('order_incidents_order_id_kind_phase_key_key').on(t.orderId,t.kind,t.phaseKey),index('order_incidents_status_idx').on(t.status,t.openedAt),
 check('order_incidents_kind_check',sql`${t.kind} IN ('restaurant_response','driver_unassigned','driver_pickup')`),
 check('order_incidents_status_check',sql`${t.status} IN ('open','acknowledged','resolved')`),check('order_incidents_version_check',sql`${t.version} >= 1`)]);
