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
test("long batches report completed progress without starting overlapping work", async () => {
  let release!: () => void, started!: () => void;
  let runs = 0,
    pulses = 0;
  const gate = new Promise<void>((r) => (release = r)),
    began = new Promise<void>((r) => (started = r));
  const loop = startWorkerLoop({
    intervalMs: 5,
    onError: () => {},
    onSuccess: async () => {
      pulses++;
    },
    run: async (_stopping, progress) => {
      runs++;
      await progress();
      await progress();
      started();
      await gate;
    },
  });
  await began;
  await new Promise((r) => setTimeout(r, 15));
  assert.equal(runs, 1);
  assert.equal(pulses, 2);
  const stopped = loop.stop();
  release();
  await stopped;
  assert.equal(pulses, 3);
  assert.equal(runs, 1);
});
