CREATE TABLE driver_duty_locations (
 profile_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
 latitude double precision NOT NULL,longitude double precision NOT NULL,accuracy_meters double precision NOT NULL,
 observed_at timestamptz NOT NULL,received_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT driver_duty_coordinates_valid CHECK(latitude >= -90 AND latitude <= 90 AND longitude >= -180 AND longitude <= 180 AND accuracy_meters >= 0 AND accuracy_meters <= 10000)
);
