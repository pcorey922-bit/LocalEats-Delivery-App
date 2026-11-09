#!/usr/bin/env bash
set -euo pipefail
# Owner-run only. GH_TOKEN must be a temporary fine-grained token scoped to this
# repository's Secrets: read/write permission. Never upload keys or print values.
: "${GH_TOKEN:?Add ROCOEATS_SIGNING_SETUP_TOKEN in protected repository Actions secrets first}"
: "${GITHUB_REPOSITORY:?}"
: "${RUNNER_TEMP:?}"
existing=$(gh api "repos/$GITHUB_REPOSITORY/actions/secrets" --jq '[.secrets[].name]')
if printf '%s' "$existing" | python3 -c 'import json,sys; v=json.load(sys.stdin);sys.exit(0 if any(n in v for n in ["ROCOEATS_STAGING_KEYSTORE_BASE64","ROCOEATS_STAGING_KEYSTORE_PASSWORD"]) else 1)'; then
  echo 'A staging signing secret already exists. Refusing to rotate or overwrite the install identity.' >&2
  exit 1
fi
umask 077
key_path="$RUNNER_TEMP/rocoeats-staging-owner.p12"
encoded_path="$RUNNER_TEMP/rocoeats-staging-owner.base64"
trap 'rm -f "$key_path" "$encoded_path"' EXIT
export KEYSTORE_PASSWORD
KEYSTORE_PASSWORD=$(openssl rand -hex 32)
printf '::add-mask::%s\n' "$KEYSTORE_PASSWORD"
keytool -genkeypair -storetype PKCS12 -keystore "$key_path" -storepass:env KEYSTORE_PASSWORD -keypass:env KEYSTORE_PASSWORD -alias rocoeats-staging -keyalg RSA -keysize 3072 -sigalg SHA256withRSA -validity 3650 -dname 'CN=RoCoEats Staging, O=RoCoEats, C=US' -noprompt
base64 -w 0 "$key_path" > "$encoded_path"
gh secret set ROCOEATS_STAGING_KEYSTORE_BASE64 --repo "$GITHUB_REPOSITORY" < "$encoded_path"
printf '%s' "$KEYSTORE_PASSWORD" | gh secret set ROCOEATS_STAGING_KEYSTORE_PASSWORD --repo "$GITHUB_REPOSITORY"
# Remove bootstrap access after use; the owner should revoke the short-lived PAT too.
gh secret delete ROCOEATS_SIGNING_SETUP_TOKEN --repo "$GITHUB_REPOSITORY"
echo 'Owner-controlled staging signing secrets saved. No private key artifact was created. Run target=staging next.'
