// No request headers or user input may determine trusted checkout/CORS origins.
export function containerEnvironment(env) {
  const result = { ...env };
  if (env.RENDER === "true") {
    const url = new URL(env.RENDER_EXTERNAL_URL || "invalid:");
    if (url.protocol !== "https:" || !url.hostname.endsWith(".onrender.com") ||
        url.username || url.password || url.port || url.pathname !== "/" || url.search || url.hash)
      throw new Error("RENDER_EXTERNAL_URL must be the Render-assigned HTTPS origin");
    result.PUBLIC_APP_URL ||= url.origin;
    result.CORS_ORIGINS ||= result.PUBLIC_APP_URL;
    result.CLERK_PUBLISHABLE_KEY ||= env.VITE_CLERK_PUBLISHABLE_KEY;
    if (env.ROCOEATS_PRIVATE_STAGING !== "true")
      throw new Error("Render staging requires ROCOEATS_PRIVATE_STAGING=true");
  }
  const privateOrders = result.ROCOEATS_PRIVATE_TEST_ORDERING_ENABLED;
  if (privateOrders !== undefined && !["true", "false"].includes(privateOrders))
    throw new Error("Use true or false for ROCOEATS_PRIVATE_TEST_ORDERING_ENABLED");
  if (privateOrders === "true" &&
      (result.ROCOEATS_PRIVATE_STAGING !== "true" || result.ROCOEATS_ORDERING_ENABLED !== "false"))
    throw new Error("Private test ordering requires private staging and explicitly closed public ordering");
  if (result.ROCOEATS_PRIVATE_STAGING === "true") {
    const owners = (result.LOCALEATS_ADMIN_CLERK_USER_IDS || "").split(",").map(s => s.trim()).filter(Boolean);
    const drivers = (result.ROCOEATS_OWNER_DRIVER_CLERK_USER_IDS || "").split(",").map(s => s.trim()).filter(Boolean);
    if (!owners.length || !owners.every(id => /^user_[A-Za-z0-9]+$/.test(id)))
      throw new Error("Private staging requires valid LOCALEATS_ADMIN_CLERK_USER_IDS");
    if (drivers.some(id => !owners.includes(id)))
      throw new Error("Owner driver identities must also be configured administrators");
    if (!result.CLERK_PUBLISHABLE_KEY?.startsWith("pk_test_") || !result.CLERK_SECRET_KEY?.startsWith("sk_test_"))
      throw new Error("Private staging requires Clerk Development keys");
    if (result.PAYMENT_PROVIDER !== "stripe_test" || !/^sk_test_[A-Za-z0-9]+$/.test(result.STRIPE_SECRET_KEY || ""))
      throw new Error("Private staging requires Stripe test credentials");
    if ((result.ROCOEATS_ORDERING_ENABLED === "true" || privateOrders === "true") && !/^whsec_[A-Za-z0-9]+$/.test(result.STRIPE_WEBHOOK_SECRET || ""))
      throw new Error("Configure STRIPE_WEBHOOK_SECRET before enabling test ordering");
  }
  return result;
}
