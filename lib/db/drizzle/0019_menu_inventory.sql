-- NULL means untracked stock; no historical deductions are invented.
ALTER TABLE menu_items ADD COLUMN stock_on_hand integer;
ALTER TABLE menu_items ADD COLUMN stock_revision integer NOT NULL DEFAULT 0;
ALTER TABLE menu_items ADD CONSTRAINT menu_inventory_valid
  CHECK (stock_on_hand IS NULL OR stock_on_hand >= 0);
ALTER TABLE menu_items ADD CONSTRAINT menu_inventory_revision_valid CHECK (stock_revision >= 0);
ALTER TABLE order_items ADD COLUMN inventory_deducted integer NOT NULL DEFAULT 0;
ALTER TABLE order_items ADD CONSTRAINT order_inventory_deducted_valid
  CHECK (inventory_deducted >= 0 AND inventory_deducted <= quantity);
