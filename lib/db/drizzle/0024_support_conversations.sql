CREATE TABLE support_messages (
 id uuid PRIMARY KEY,case_id uuid NOT NULL REFERENCES support_cases(id),author_profile_id uuid NOT NULL REFERENCES profiles(id),
 author_role text NOT NULL,kind text NOT NULL CHECK(kind IN ('reply','decision')),body text NOT NULL,
 case_version integer NOT NULL CHECK(case_version>0),status_after text NOT NULL CHECK(status_after IN ('open','in_review','resolved')),
 created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(case_id,case_version)
);
INSERT INTO support_messages(id,case_id,author_profile_id,author_role,kind,body,case_version,status_after,created_at)
 SELECT gen_random_uuid(),id,reviewed_by,'admin','decision',resolution,version,status,updated_at FROM support_cases WHERE reviewed_by IS NOT NULL AND resolution IS NOT NULL;
CREATE FUNCTION rocoeats_support_message_immutable() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Support messages are append-only'; END $$;
CREATE TRIGGER support_message_immutable BEFORE UPDATE OR DELETE ON support_messages FOR EACH ROW EXECUTE FUNCTION rocoeats_support_message_immutable();
CREATE TRIGGER support_message_no_truncate BEFORE TRUNCATE ON support_messages FOR EACH STATEMENT EXECUTE FUNCTION rocoeats_support_message_immutable();
