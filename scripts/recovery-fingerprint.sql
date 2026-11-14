-- Run only against a quiescent fixture database during a recovery rehearsal.
BEGIN;
CREATE TEMP TABLE recovery_fingerprints (name text PRIMARY KEY, digest text NOT NULL);
DO $$
DECLARE t record; fingerprint text;
BEGIN
 FOR t IN SELECT schemaname, tablename FROM pg_tables WHERE schemaname IN ('public','drizzle') ORDER BY schemaname,tablename LOOP
  EXECUTE format('SELECT md5(coalesce(string_agg(row_json, E''\n'' ORDER BY row_json),'''')) FROM (SELECT row_to_json(r)::text AS row_json FROM %I.%I r) rows',t.schemaname,t.tablename) INTO fingerprint;
  INSERT INTO recovery_fingerprints VALUES(t.schemaname||'.'||t.tablename,fingerprint);
 END LOOP;
 INSERT INTO recovery_fingerprints
 SELECT 'sequence:'||schemaname||'.'||sequencename,md5(concat_ws(':',start_value,min_value,max_value,increment_by,cycle,cache_size,last_value))
 FROM pg_sequences WHERE schemaname IN ('public','drizzle');
END $$;
SELECT md5(coalesce(string_agg(name||':'||digest,E'\n' ORDER BY name),'')) AS fingerprint FROM recovery_fingerprints;
ROLLBACK;
