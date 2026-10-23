import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";

test("Vercel Express entrypoint exports an app and reports missing deployment configuration", async () => {
  const prior = Object.fromEntries(["VERCEL", "LEGACYLINK_ACCOUNTS", "LEGACYLINK_SECRET", "LEGACYLINK_UPSTASH_URL", "LEGACYLINK_UPSTASH_TOKEN", "LEGACYLINK_DDB_TABLE", "DYNAMODB_TABLE_NAME", "AWS_ROLE_ARN"].map((key) => [key, process.env[key]]));
  process.env.VERCEL = "1";
  delete process.env.LEGACYLINK_ACCOUNTS;
  delete process.env.LEGACYLINK_SECRET;
  delete process.env.LEGACYLINK_UPSTASH_URL;
  delete process.env.LEGACYLINK_UPSTASH_TOKEN;
  delete process.env.LEGACYLINK_DDB_TABLE;
  delete process.env.DYNAMODB_TABLE_NAME;
  delete process.env.AWS_ROLE_ARN;

  const [{ createApp }, entrypoint] = await Promise.all([
    import("../src/server.mjs"),
    import("../src/index.mjs"),
  ]);
  assert.equal(typeof entrypoint.default, "function");
  assert.equal(typeof entrypoint.default.handle, "function");

  const server = createApp().listen(0);
  await once(server, "listening");
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const missing = await fetch(base + "/health");
    assert.equal(missing.status, 503);
    assert.deepEqual((await missing.json()).missing, [
      "configure persistent storage with Upstash or DynamoDB",
      "set LEGACYLINK_ACCOUNTS=1",
      "set LEGACYLINK_SECRET",
    ]);

    process.env.LEGACYLINK_ACCOUNTS = "1";
    process.env.LEGACYLINK_SECRET = "test-only-secret";
    process.env.DYNAMODB_TABLE_NAME = "aws-dynamodb-sky-nest";
    process.env.AWS_ROLE_ARN = "arn:aws:iam::123456789012:role/test-only";
    const ready = await fetch(base + "/health");
    assert.equal(ready.status, 200);
    assert.equal((await ready.json()).store, "dynamodb");
  } finally {
    server.close();
    await once(server, "close");
    for (const [key, value] of Object.entries(prior)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
