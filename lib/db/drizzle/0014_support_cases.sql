CREATE TABLE support_cases (
 id uuid PRIMARY KEY, created_by uuid NOT NULL REFERENCES profiles(id), order_id uuid REFERENCES orders(id),
 category text NOT NULL CHECK(category IN ('delivery','payment','account','other')), subject text NOT NULL,message text NOT NULL,request_hash text NOT NULL,
 status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','in_review','resolved')),version integer NOT NULL DEFAULT 1 CHECK(version>0),resolution text,reviewed_by uuid REFERENCES profiles(id),
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX support_cases_author ON support_cases(created_by,created_at DESC);
CREATE INDEX support_cases_status ON support_cases(status,created_at DESC);
