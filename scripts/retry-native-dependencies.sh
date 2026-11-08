#!/usr/bin/env bash
# Only wrap dependency resolution, never compiler/lint/test steps.
set -uo pipefail
if [[ $# -eq 0 ]]; then
  echo "Usage: bash scripts/retry-native-dependencies.sh <dependency command> [args...]" >&2
  exit 64
fi
retry_delay="${ROCOEATS_NATIVE_RETRY_DELAY_SECONDS:-5}"
if [[ ! "$retry_delay" =~ ^([0-9]|10)$ ]]; then
  echo "ROCOEATS_NATIVE_RETRY_DELAY_SECONDS must be an integer from 0 to 10" >&2
  exit 64
fi
retry_log="$(mktemp "${TMPDIR:-/tmp}/rocoeats-native-download.XXXXXX")" || exit 1
trap 'rm -f "$retry_log"' EXIT
for attempt in 1 2 3; do
  "$@" 2>&1 | tee "$retry_log"
  result=${PIPESTATUS[0]}
  if [[ "$result" -eq 0 ]]; then exit 0; fi
  # Preserve genuine configuration/compiler failures. Retry only known transient
  # official dependency transport failures, with a bounded backoff.
  if [[ "$attempt" -eq 3 ]] || ! grep -Eiq '(HTTP|response|status).*50[234]|(download|connect|read).*timed out|connection reset' "$retry_log"; then
    exit "$result"
  fi
  echo "Transient native dependency download failed; retry $((attempt + 1))/3." >&2
  sleep "$((retry_delay * attempt))"
done
