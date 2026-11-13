import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { contentSecurityPolicy, securityHeaders } from './security-headers';
const key = `pk_test_${Buffer.from('example.clerk.accounts.dev$').toString('base64')}`;
test('CSP allows the configured Clerk and hosted Stripe flow without allowing inline scripts', () => {
  const csp = contentSecurityPolicy({ NODE_ENV: 'production', PUBLIC_APP_URL: 'https://staging.example', CLERK_PUBLISHABLE_KEY: key });
  const directives = Object.fromEntries(csp.split('; ').map(part => [part.split(' ')[0], part.slice(part.indexOf(' ') + 1)]));
  assert.match(directives['script-src'], /https:\/\/example\.clerk\.accounts\.dev/);
  assert.doesNotMatch(directives['script-src'], /unsafe-inline|unsafe-eval|https: /);
  assert.equal(directives['script-src-attr'], "'none'");
  assert.match(directives['connect-src'], /https:\/\/\*\.protect\.clerk\.com:\*/);
  assert.match(directives['form-action'], /https:\/\/checkout\.stripe\.com/);
  assert.equal(directives['frame-ancestors'], "'none'");
  assert.equal(directives['object-src'], "'none'");
  assert.match(csp, /upgrade-insecure-requests/);
  assert.doesNotMatch(contentSecurityPolicy({ CLERK_PUBLISHABLE_KEY: 'pk_test_bad; script-src *', VITE_API_ORIGIN: 'https://user:password@evil.example' }), /evil\.example|password|script-src \*/);
});
test('HSTS is emitted only for a trusted HTTPS production deployment, including error responses', async () => {
  for (const production of [false, true]) {
    const app = express();
    app.use(securityHeaders({ NODE_ENV: production ? 'production' : 'test', PUBLIC_APP_URL: production ? 'https://staging.example' : 'http://localhost' }));
    app.get('/ok', (_req, res) => res.json({ ok: true }));
    const server = app.listen(0, '127.0.0.1');
    await new Promise<void>(resolve => server.once('listening', resolve));
    try {
      for (const path of ['/ok', '/missing']) {
        const response = await fetch(`http://127.0.0.1:${(server.address() as { port: number }).port}${path}`, { headers: { 'x-forwarded-proto': 'https', 'x-forwarded-host': 'evil.example' } });
        assert.equal(response.headers.get('strict-transport-security'), production ? 'max-age=31536000' : null);
        if (path === '/missing') assert.equal(response.headers.get('content-security-policy'), "default-src 'none'");
        else assert.match(response.headers.get('content-security-policy')!, /frame-ancestors 'none'/);
        assert.doesNotMatch(response.headers.get('content-security-policy')!, /evil\.example/);
      }
    } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
  }
});

test('map compatibility is scoped to explicitly configured real map IDs', () => {
  assert.doesNotMatch(contentSecurityPolicy({ ROCOEATS_GOOGLE_MAPS_BROWSER_KEY: 'fixture', ROCOEATS_GOOGLE_MAPS_MAP_ID: 'DEMO_MAP_ID' }), /unsafe-eval|https:\/\/maps.googleapis.com/);
  const enabled = contentSecurityPolicy({ ROCOEATS_GOOGLE_MAPS_BROWSER_KEY: 'fixture', ROCOEATS_GOOGLE_MAPS_MAP_ID: 'configured-map' });
  assert.match(enabled, /https:\/\/maps.googleapis.com/);
  assert.match(enabled, /worker-src 'self' blob:/);
});
