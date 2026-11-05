import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
await mkdir('dist/tests', { recursive: true });
try {
  for (const [name, entry] of [['dashboard-sections', 'src/lib/dashboard-sections.test.ts'], ['order-lifecycle', 'src/lib/order-lifecycle.test.ts'], ['mobile-api', 'tests/mobile-api.test.ts']]) {
    const outfile = `dist/tests/${name}.mjs`;
    await build({ entryPoints: [entry], outfile, bundle: true, platform: 'node', format: 'esm' });
    const result = spawnSync(process.execPath, ['--test', outfile], { stdio: 'inherit' });
    if (result.status !== 0) process.exitCode = 1;
  }
} finally { await rm('dist/tests', { recursive: true, force: true }); }
