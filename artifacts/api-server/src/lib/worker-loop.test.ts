import assert from "node:assert/strict";
import { test } from "node:test";
import { runWorkerBatch, startWorkerLoop } from "./worker-loop";

test("a failed batch waits for sibling work before shutdown or reporting failure", async () => {
  let release!: (worked: boolean) => void;
  const sibling = new Promise<boolean>((resolve) => { release = resolve; });
  const failure = new Error("Job failed");
  const errors: unknown[] = [];
  let runs = 0;
  let pulses = 0;
  const loop = startWorkerLoop({
    intervalMs: 60_000,
    onError: (error) => { errors.push(error); },
    onSuccess: async () => { pulses++; },
    run: async () => {
      runs++;
      await runWorkerBatch([Promise.reject(failure), sibling]);
    },
  });
  await new Promise<void>((resolve) => setImmediate(resolve));
  let stopped = false;
  const stop = loop.stop().then(() => { stopped = true; });
  try {
    await new Promise<void>((resolve) => setImmediate(resolve));
    assert.equal(loop.running(), true);
    assert.equal(stopped, false);
    assert.deepEqual(errors, []);
  } finally {
    release(true);
    await stop;
  }
  assert.deepEqual(errors, [failure]);
  assert.equal(pulses, 0);
  assert.equal(runs, 1);
});

test("a successful batch reports whether any job ran", async () => {
  assert.equal(await runWorkerBatch([Promise.resolve(false)]), false);
  assert.equal(await runWorkerBatch([Promise.resolve(false), Promise.resolve(true)]), true);
});
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
