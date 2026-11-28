CREATE TABLE driver_applications (
 profile_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
 phone text NOT NULL, vehicle_make text NOT NULL, vehicle_model text NOT NULL, vehicle_year integer NOT NULL,
 license_state text NOT NULL, license_expires_on text NOT NULL,
 eligibility_attested boolean NOT NULL, insurance_attested boolean NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
 version integer NOT NULL DEFAULT 1 CHECK(version > 0),
 review_note text, reviewed_by uuid REFERENCES profiles(id), reviewed_at timestamptz, submitted_at timestamptz NOT NULL DEFAULT now()
);
