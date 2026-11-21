import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import express from "express";
import { webHosting } from "./web-hosting";
test("deployed website serves deep links without intercepting APIs or exposing files", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "rocoeats-web-"));
  await mkdir(path.join(root, "assets"));
  await writeFile(
    path.join(root, "index.html"),
    "<html><title>RoCoEats build fixture</title></html>",
  );
  await writeFile(
    path.join(root, "assets", "app-abcdefgh.js"),
    "window.fixture=true;",
  );
  await writeFile(path.join(root, ".secret"), "private");
  const app = express();
  app.use(webHosting(root));
  app.get("/api/check", (_req, res) => res.json({ ok: true }));
  const server = app.listen(0);
  await new Promise<void>((r) => server.once("listening", r));
  const origin = `http://localhost:${(server.address() as { port: number }).port}`;
  try {
    const page = await fetch(`${origin}/orders/history`, {
      headers: { accept: "text/html" },
    });
    assert.equal(page.status, 200);
    assert.match(await page.text(), /RoCoEats build fixture/);
    assert.equal(page.headers.get("cache-control"), "no-store");
    assert.deepEqual(await (await fetch(`${origin}/api/check`)).json(), {
      ok: true,
    });
    assert.equal(
      (
        await fetch(`${origin}/api/missing`, {
          headers: { accept: "text/html" },
        })
      ).status,
      404,
    );
    assert.equal((await fetch(`${origin}/assets/missing.js`)).status, 404);
    assert.equal((await fetch(`${origin}/.secret`)).status, 404);
    assert.equal(
      (await fetch(`${origin}/orders`, { method: "POST" })).status,
      404,
    );
    const asset = await fetch(`${origin}/assets/app-abcdefgh.js`);
    assert.match(asset.headers.get("cache-control") ?? "", /immutable/);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    await rm(root, { recursive: true, force: true });
  }
});
