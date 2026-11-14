import { pathToFileURL } from "node:url";
export function checkStagingEnvironment(env) {
  const errors = [],
    required = [
      "ROCOEATS_DB_PASSWORD",
      "CLERK_PUBLISHABLE_KEY",
      "CLERK_SECRET_KEY",
      "LOCALEATS_ADMIN_CLERK_USER_IDS",
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "PUBLIC_APP_URL",
      "CORS_ORIGINS",
    ];
  for (const key of required)
    if (!env[key]?.trim() || /REPLACE|CHANGEME|EXAMPLE|[<>]/i.test(env[key]))
      errors.push(
        `${key}: enter the real staging setting through secure local/host configuration`,
      );
  if (
    env.ROCOEATS_DB_PASSWORD &&
    !/^[a-f0-9]{64,128}$/i.test(env.ROCOEATS_DB_PASSWORD)
  )
    errors.push("ROCOEATS_DB_PASSWORD: use 32–64 random bytes encoded as hex");
  if (
    env.CLERK_PUBLISHABLE_KEY &&
    !env.CLERK_PUBLISHABLE_KEY.startsWith("pk_test_")
  )
    errors.push(
      "CLERK_PUBLISHABLE_KEY: use the separate staging development instance",
    );
  if (env.CLERK_SECRET_KEY && !env.CLERK_SECRET_KEY.startsWith("sk_test_"))
    errors.push(
      "CLERK_SECRET_KEY: use the separate staging development instance",
    );
  if (env.STRIPE_SECRET_KEY && !env.STRIPE_SECRET_KEY.startsWith("sk_test_"))
    errors.push(
      "STRIPE_SECRET_KEY: Stripe TEST secret key required; live/restricted keys are refused",
    );
  if (
    env.STRIPE_WEBHOOK_SECRET &&
    !env.STRIPE_WEBHOOK_SECRET.startsWith("whsec_")
  )
    errors.push("STRIPE_WEBHOOK_SECRET: use a test webhook signing secret");
  if (
    env.LOCALEATS_ADMIN_CLERK_USER_IDS &&
    !env.LOCALEATS_ADMIN_CLERK_USER_IDS.split(",").every((v) =>
      /^user_[a-zA-Z0-9]+$/.test(v.trim()),
    )
  )
    errors.push(
      "LOCALEATS_ADMIN_CLERK_USER_IDS: enter Clerk user IDs, not emails",
    );
  let origin;
  try {
    const url = new URL(env.PUBLIC_APP_URL);
    if (
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== "/" ||
      !["https:", "http:"].includes(url.protocol) ||
      (url.protocol === "http:" &&
        !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
    )
      throw new Error();
    origin = url.origin;
  } catch {
    errors.push(
      "PUBLIC_APP_URL: use an HTTPS origin, or HTTP loopback for local staging",
    );
  }
  const origins = env.CORS_ORIGINS?.split(",").map((s) => s.trim()) ?? [];
  if (
    origins.some((s) => {
      try {
        if (s === "capacitor://localhost") return false;
        const url = new URL(s);
        return (
          url.origin !== s ||
          !!url.username ||
          !!url.password ||
          (url.protocol !== "https:" &&
            !(
              url.protocol === "http:" &&
              ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
            ))
        );
      } catch {
        return true;
      }
    }) ||
    (origin && !origins.includes(origin))
  )
    errors.push(
      "CORS_ORIGINS: include the app origin and use only explicit HTTPS/native/loopback origins",
    );
  if (!["false", "true"].includes(env.ROCOEATS_ORDERING_ENABLED ?? "false"))
    errors.push("ROCOEATS_ORDERING_ENABLED: explicitly use false or true");
  if (!!env.VITE_GOOGLE_MAPS_API_KEY !== !!env.VITE_GOOGLE_MAPS_MAP_ID)
    errors.push(
      "Maps: configure both the origin-restricted public key and map ID, or neither",
    );
  const administrators = (env.LOCALEATS_ADMIN_CLERK_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (
    (env.ROCOEATS_OWNER_DRIVER_CLERK_USER_IDS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .some((id) => !administrators.includes(id))
  )
    errors.push(
      "ROCOEATS_OWNER_DRIVER_CLERK_USER_IDS: owner driver IDs must also be server-allowlisted administrators",
    );
  return errors;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const errors = checkStagingEnvironment(process.env);
  if (errors.length) {
    for (const error of errors) console.error(error);
    process.exitCode = 1;
  } else
    console.log(
      "Staging settings passed format checks. Credentials/provider access, private HTTPS, migrations, pricing and four-role E2E still require verification. No external action was performed.",
    );
}
