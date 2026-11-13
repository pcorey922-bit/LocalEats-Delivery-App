import type { RequestHandler } from 'express';

function httpsOrigin(value: string | undefined) {
  try {
    const url = new URL(value ?? '');
    return url.protocol === 'https:' && !url.username && !url.password ? url.origin : null;
  } catch { return null; }
}
function clerkOrigin(key: string | undefined) {
  if (!key || !/^pk_(test|live)_[A-Za-z0-9_-]+={0,2}$/.test(key)) return null;
  const host = Buffer.from(key.replace(/^pk_(test|live)_/, ''), 'base64url').toString().replace(/\$$/, '');
  return /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/i.test(host) ? httpsOrigin(`https://${host}`) : null;
}
export function contentSecurityPolicy(env: NodeJS.ProcessEnv = process.env) {
  const clerk = clerkOrigin(env.CLERK_PUBLISHABLE_KEY);
  const api = httpsOrigin(env.VITE_API_ORIGIN);
  const configuredMap = (key: string | undefined, id: string | undefined) => Boolean(key?.trim() && id?.trim() && id.trim() !== 'DEMO_MAP_ID');
  const maps = configuredMap(env.ROCOEATS_GOOGLE_MAPS_BROWSER_KEY, env.ROCOEATS_GOOGLE_MAPS_MAP_ID) ||
    configuredMap(env.VITE_GOOGLE_MAPS_API_KEY, env.VITE_GOOGLE_MAPS_MAP_ID);
  const scripts = ["'self'", clerk, 'https://challenges.cloudflare.com', 'https://*.protect.clerk.com',
    'https://js.stripe.com', 'https://*.js.stripe.com', ...(maps ? ['https://maps.googleapis.com', 'https://maps.gstatic.com', "'unsafe-eval'"] : [])];
  const policy: Record<string, (string | null)[]> = {
    'default-src': ["'self'"],
    'base-uri': ["'none'"], 'object-src': ["'none'"], 'frame-ancestors': ["'none'"],
    'script-src': scripts, 'script-src-attr': ["'none'"],
    // React/Clerk use runtime inline styles; inline scripts remain blocked.
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
    'img-src': ["'self'", 'data:', 'blob:', 'https://img.clerk.com', 'https://*.googleusercontent.com',
      ...(maps ? ['https://*.googleapis.com', 'https://*.gstatic.com', 'https://*.google.com', 'https://*.ggpht.com'] : [])],
    'connect-src': ["'self'", clerk, api, 'https://clerk-telemetry.com', 'https://*.clerk-telemetry.com',
      'https://*.protect.clerk.com:*', 'https://api.stripe.com', 'https://img.clerk.com', 'https://fonts.googleapis.com', 'https://fonts.gstatic.com',
      ...(maps ? ['https://*.googleapis.com', 'https://*.gstatic.com', 'https://*.google.com', 'data:', 'blob:'] : [])],
    'frame-src': ["'self'", clerk, 'https://challenges.cloudflare.com', 'https://*.protect.clerk.com',
      'https://js.stripe.com', 'https://*.js.stripe.com', 'https://hooks.stripe.com', ...(maps ? ['https://*.google.com'] : [])],
    'form-action': ["'self'", clerk, 'https://checkout.stripe.com'],
    'worker-src': ["'self'", 'blob:'], 'manifest-src': ["'self'"],
  };
  const directives = Object.entries(policy).map(([name, values]) => `${name} ${[...new Set(values.filter(Boolean))].join(' ')}`);
  if (env.NODE_ENV === 'production' && httpsOrigin(env.PUBLIC_APP_URL)) directives.push('upgrade-insecure-requests');
  return directives.join('; ');
}
export function securityHeaders(env: NodeJS.ProcessEnv = process.env): RequestHandler {
  return (_req, res, next) => {
    res.setHeader('Content-Security-Policy', contentSecurityPolicy(env));
    // The trusted deployment origin, not caller-controlled forwarded headers,
    // determines HTTPS deployment. Browsers ignore HSTS on plain HTTP responses.
    if (env.NODE_ENV === 'production' && httpsOrigin(env.PUBLIC_APP_URL))
      res.setHeader('Strict-Transport-Security', 'max-age=31536000');
    next();
  };
}
