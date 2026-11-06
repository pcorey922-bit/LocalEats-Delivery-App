ALTER TABLE menu_items ADD COLUMN modifier_groups jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE order_items ADD COLUMN modifier_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb;
