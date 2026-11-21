import assert from "node:assert/strict";
import test from "node:test";
import { publicAccuracyArguments } from "./verify-geocodio-public.mjs";
test("public geocoding CLI defaults offline and requires both live and free-tier confirmation", () => {
  assert.deepEqual(publicAccuracyArguments([]), {
    live: false,
    freeTierConfirmed: false,
  });
  assert.deepEqual(publicAccuracyArguments(["--live", "--confirm-free-tier"]), {
    live: true,
    freeTierConfirmed: true,
  });
  assert.deepEqual(publicAccuracyArguments(["--confirm-free-tier", "--live"]), {
    live: true,
    freeTierConfirmed: true,
  });
  for (const args of [
    ["--live"],
    ["--confirm-free-tier"],
    ["--live", "--live"],
    ["--run"],
    ["--live", "--confirm-free-tier", "--address=private"],
  ])
    assert.throws(() => publicAccuracyArguments(args));
});
test("CLI rejects custom files, URLs, addresses and key arguments without echoing them", () => {
  for (const arg of [
    "--key=sensitive_marker_never_echo",
    "--address=sensitive_marker_never_echo",
    "--file=sensitive_marker_never_echo",
    "--url=https://sensitive_marker_never_echo",
  ]) {
    assert.throws(
      () => publicAccuracyArguments([arg]),
      (error) =>
        error instanceof Error &&
        !error.message.includes("sensitive_marker_never_echo"),
    );
  }
});
