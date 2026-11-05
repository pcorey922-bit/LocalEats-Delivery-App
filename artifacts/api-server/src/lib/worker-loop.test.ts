import assert from "node:assert/strict";
import { test } from "node:test";
import { startWorkerLoop } from "./worker-loop";
test("shutdown stops new claims and waits for current work", async () => {
  let release!: () => void;
  let began!: () => void;
  let runs = 0;
  const gate = new Promise<void>((r) => (release = r));
  const started = new Promise<void>((r) => (began = r));
  const loop = startWorkerLoop({
    intervalMs: 5,
    onError: () => {},
    run: async () => {
      runs++;
      began();
      await gate;
    },
  });
  await started;
  let stopped = false;
  const stop = loop.stop().then(() => (stopped = true));
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(stopped, false);
  assert.equal(runs, 1);
  release();
  await stop;
  await new Promise((r) => setTimeout(r, 15));
  assert.equal(runs, 1);
  assert.equal(stopped, true);
});
