#!/usr/bin/env bash
# CI-only rehearsal. Refuses production source names and existing restore targets.
set -euo pipefail
umask 077
: "${POSTGRES_CONTAINER:?Set the ephemeral PostgreSQL test container ID}"
: "${PGUSER:?Set the fixture PostgreSQL user}"
: "${PGPASSWORD:?Set the fixture PostgreSQL password through the environment}"
source_db="${SOURCE_DATABASE:-rocoeats_test}"
target_db="${RESTORE_DATABASE:-rocoeats_recovery_${GITHUB_RUN_ID:-local}_$$}"
if [[ "$source_db" != rocoeats_test || ! "$target_db" =~ ^rocoeats_recovery_[a-z0-9_]+$ ]]; then
  echo 'Recovery drill accepts only rocoeats_test and a rocoeats_recovery_ fixture target' >&2
  exit 2
fi
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
work="$(mktemp -d)"
created=0
run_pg() { docker exec --interactive --env PGUSER --env PGPASSWORD "$POSTGRES_CONTAINER" "$@"; }
cleanup() {
  result=$?
  trap - EXIT
  if [[ "$created" == 1 ]]; then
    if ! run_pg dropdb --if-exists --force "$target_db" >/dev/null 2>&1; then echo 'Failed to remove the disposable recovery database' >&2; result=1; fi
  fi
  rm -rf -- "$work" || result=1
  exit "$result"
}
trap cleanup EXIT
run_pg pg_dump --format=custom --no-owner --no-privileges --dbname="$source_db" > "$work/backup.dump"
# createdb must succeed before cleanup is authorized to remove this target.
run_pg createdb "$target_db"
created=1
run_pg pg_restore --single-transaction --exit-on-error --no-owner --no-privileges --dbname="$target_db" < "$work/backup.dump"
fingerprint() { run_pg psql --no-psqlrc --quiet --tuples-only --no-align --set ON_ERROR_STOP=1 --dbname="$1" < "$script_dir/recovery-fingerprint.sql"; }
source_fingerprint="$(fingerprint "$source_db")"
restored_fingerprint="$(fingerprint "$target_db")"
[[ "$source_fingerprint" == "$restored_fingerprint" ]] || { echo 'Restored row or sequence fingerprint mismatch' >&2; exit 1; }
schema_fingerprint() {
  run_pg pg_dump --schema-only --no-owner --no-privileges --dbname="$1" |
    grep -vE '^--|^\\(un)?restrict ' | sha256sum | cut -d' ' -f1
}
[[ "$(schema_fingerprint "$source_db")" == "$(schema_fingerprint "$target_db")" ]] || { echo 'Restored schema, constraint or trigger mismatch' >&2; exit 1; }
run_pg psql -X --set ON_ERROR_STOP=1 --dbname="$target_db" --command "DO \$\$ BEGIN IF EXISTS(SELECT transaction_id FROM ledger_lines GROUP BY transaction_id HAVING sum(amount_cents)<>0 OR count(*)<2) THEN RAISE EXCEPTION 'Restored ledger is unbalanced'; END IF; IF NOT EXISTS(SELECT 1 FROM ledger_lines) THEN RAISE EXCEPTION 'Fixture has no ledger data for recovery verification'; END IF; END \$\$;" >/dev/null
if run_pg psql -X --set ON_ERROR_STOP=1 --dbname="$target_db" --command 'BEGIN; UPDATE ledger_lines SET amount_cents=amount_cents WHERE id=(SELECT id FROM ledger_lines LIMIT 1); ROLLBACK;' > /dev/null 2> "$work/guard.err"; then
  echo 'Restored immutable-ledger guard did not reject an update' >&2; exit 1
fi
grep -q 'Ledger records are append-only' "$work/guard.err" || { echo 'Ledger guard failed for an unexpected reason' >&2; exit 1; }
if run_pg psql -X --set ON_ERROR_STOP=1 --dbname="$target_db" --command "BEGIN; INSERT INTO ledger_transactions(id,order_id,kind,fingerprint) SELECT 'recovery-unbalanced-probe',order_id,'recovery_probe','probe' FROM ledger_transactions LIMIT 1; COMMIT;" > /dev/null 2> "$work/balance.err"; then
  echo 'Restored deferred ledger-balance guard did not reject an empty journal' >&2; exit 1
fi
grep -q 'Ledger transaction must balance' "$work/balance.err" || { echo 'Balance guard failed for an unexpected reason' >&2; exit 1; }
echo 'PostgreSQL recovery verified: rows, sequences, schema, balance and immutable ledger guards'
