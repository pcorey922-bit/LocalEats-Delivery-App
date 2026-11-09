import { test } from "node:test";
import assert from "node:assert/strict";
import { guestAccessLink } from "../../localeats/src/lib/guest-access-link";
const token = "A".repeat(43);
test("native guest links use the actual HTTPS staging site and keep capabilities out of queries", () => {
  const link = new URL(
    guestAccessLink({
      token,
      pageOrigin: "https://localhost",
      apiOrigin: "https://staging.example.test",
      native: true,
    }),
  );
  assert.equal(link.origin, "https://staging.example.test");
  assert.equal(link.pathname, "/guest/order");
  assert.equal(link.search, "");
  assert.equal(link.hash, `#access=${token}`);
  assert.throws(() =>
    guestAccessLink({
      token,
      pageOrigin: "capacitor://localhost",
      native: true,
    }),
  );
  assert.throws(() =>
    guestAccessLink({
      token,
      pageOrigin: "https://localhost",
      apiOrigin: "http://staging.example.test",
      native: true,
    }),
  );
});
test("guest links reject credential-bearing origins, path injection and malformed capabilities", () => {
  for (const apiOrigin of [
    "https://user:pass@example.test",
    "https://example.test/api",
    "https://example.test?access=bad",
    "javascript:alert(1)",
  ])
    assert.throws(() =>
      guestAccessLink({
        token,
        pageOrigin: "https://example.test",
        apiOrigin,
        native: true,
      }),
    );
  assert.throws(() =>
    guestAccessLink({ token: "bad", pageOrigin: "https://example.test" }),
  );
  assert.throws(() =>
    guestAccessLink({
      token,
      pageOrigin: "https://example.test",
      basePath: "//other.example.test",
    }),
  );
  const link = new URL(
    guestAccessLink({
      token,
      pageOrigin: "https://web.example.test",
      basePath: "/staging/",
    }),
  );
  assert.equal(link.pathname, "/staging/guest/order");
});
