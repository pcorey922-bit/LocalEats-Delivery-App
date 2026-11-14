-- Optional admission limit. Existing restaurants retain unlimited capacity.
ALTER TABLE restaurants ADD COLUMN max_open_orders integer;
ALTER TABLE restaurants ADD CONSTRAINT restaurants_capacity_valid
  CHECK (max_open_orders IS NULL OR (max_open_orders >= 1 AND max_open_orders <= 1000));
