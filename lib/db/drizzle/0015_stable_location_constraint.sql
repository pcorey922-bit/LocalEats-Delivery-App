-- Preserve the same coordinate bounds without BETWEEN expansion. PostgreSQL
-- reparses nested BETWEEN/AND trees during restore, changing their deparsed DDL.
ALTER TABLE delivery_locations DROP CONSTRAINT delivery_locations_valid_coordinates;
ALTER TABLE delivery_locations ADD CONSTRAINT delivery_locations_valid_coordinates
CHECK (latitude >= -90 AND latitude <= 90 AND longitude >= -180 AND longitude <= 180 AND accuracy_meters >= 0);
