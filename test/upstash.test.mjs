import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

// A minimal fake of Upstash's REST API to test storage and conversation state offline.
const db = new Map();
const fake = http.createServer((req, res) => {
  let b = ""; req.on("data", (d) => (b += d));
  req.on("end", () => {
    const [cmd, key, ...a] = JSON.parse(b), h = db.get(key) instanceof Map ? db.get(key) : new Map();
    let result = null;
    if (req.headers.authorization !== "Bearer tok") { res.writeHead(401); return res.end(JSON.stringify({ error: "unauthorized" })); }
    if (cmd === "HSET") { h.set(a[0], a[1]); db.set(key, h); result = 1; }
    else if (cmd === "HGETALL") result = [...h].flat();
    else if (cmd === "HDEL") { h.delete(a[0]); result = 1; }
    else if (cmd === "GET") result = db.get(key) || null;
    else if (cmd === "SET") { db.set(key, a[0]); result = "OK"; }
    else if (cmd === "DEL") { db.delete(key); result = 1; }
    res.end(JSON.stringify({ result }));
  });
});
await new Promise((r) => fake.listen(3397, r));
process.env.LEGACYLINK_UPSTASH_URL = "http://127.0.0.1:3397";
process.env.LEGACYLINK_UPSTASH_TOKEN = "tok";
const { forHousehold, getConversation, setConversation } = await import("../src/store.mjs");
test.after(() => fake.close());

test("upstash backend stores, lists, removes and isolates households", async () => {
  const a = forHousehold("fam-a"), b = forHousehold("fam-b");
  assert.equal(a.kind, "upstash");
  await a.add({ id: "m1", title: "one", createdAt: "2026-01-01" });
  await a.add({ id: "m2", title: "two", createdAt: "2026-01-02" });
  await b.add({ id: "m3", title: "three", createdAt: "2026-01-03" });
  assert.deepEqual((await a.all()).map((m) => m.id), ["m1", "m2"]);
  assert.deepEqual((await b.all()).map((m) => m.id), ["m3"]);
  await a.remove("m1");
  assert.deepEqual((await a.all()).map((m) => m.id), ["m2"]);
  await a.clear();
  assert.equal((await a.all()).length, 0);
});

test("conversation state persists between serverless requests", async () => {
  const state = { teller: "Maya", lang: "fr", history: [], mode: "story" };
  await setConversation("family:browser-session", state);
  assert.deepEqual(await getConversation("family:browser-session"), state);
  assert.equal(await getConversation("another-family:browser-session"), null);
});
