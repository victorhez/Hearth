import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ll-acc-"));
process.env.LEGACYLINK_DATA_DIR = dir;
process.env.LEGACYLINK_ACCOUNTS = "1";
process.env.PORT = "3398";
const { createApp } = await import("../src/server.mjs");
const srv = createApp().listen(3398);
test.after(() => { srv.close(); fs.rmSync(dir, { recursive: true, force: true }); });

const B = "http://127.0.0.1:3398";
const post = (url, body, token, extra = {}) => fetch(B + url, { method: "POST", headers: { "content-type": "application/json", ...(token ? { authorization: "Bearer " + token } : {}), ...extra }, body: JSON.stringify(body || {}) });
const get = (url, token, extra = {}) => fetch(B + url, { headers: { ...(token ? { authorization: "Bearer " + token } : {}), ...extra } });

test("sign-up, login, isolation between families", async () => {
  assert.equal((await get("/api/archive")).status, 401);
  assert.equal((await post("/mcp", {})).status, 401);
  let r = await post("/api/auth/signup", { email: "a@x.com", password: "short", name: "Ann" });
  assert.equal(r.status, 400);
  r = await post("/api/auth/signup", { email: "a@x.com", password: "correct horse", name: "Ann", householdName: "The Annes" });
  assert.equal(r.status, 200);
  const A = await r.json();
  assert.equal((await post("/api/auth/signup", { email: "A@x.com", password: "correct horse" })).status, 409);
  assert.equal((await post("/api/auth/login", { email: "a@x.com", password: "wrong password" })).status, 401);
  const login = await (await post("/api/auth/login", { email: "a@x.com", password: "correct horse" })).json();
  assert.equal(login.user.household, A.user.household);

  // owner tells a story through the real pipeline
  const say = (token, utterance, session = "s") => post("/api/say", { session, utterance, teller: "Ann", lang: "en" }, token).then((x) => x.json());
  await say(A.token, "I want to tell you a story");
  await say(A.token, "In 1999 we drove to Lagos and I was so happy.");
  const saved = await say(A.token, "that's all");
  assert.ok(saved.saved);

  // a second family cannot see it, even by forging the household header
  const B2 = await (await post("/api/auth/signup", { email: "b@x.com", password: "another pass1", name: "Bo" })).json();
  const arch = await (await get("/api/archive", B2.token, { "x-household": A.user.household })).json();
  assert.equal(arch.memories.length, 0);
  const mine = await (await get("/api/archive", A.token)).json();
  assert.equal(mine.memories.length, 1);

  // tampered token is rejected
  assert.equal((await get("/api/archive", A.token.slice(0, -3) + "abc")).status, 401);

  // invite flow
  const inv = await (await post("/api/auth/invite", {}, A.token)).json();
  assert.match(inv.code, /^[0-9A-F]{8}$/);
  assert.equal((await post("/api/auth/join", { code: "NOPE", email: "c@x.com", password: "password123" })).status, 400);
  const C = await (await post("/api/auth/join", { code: inv.code, email: "c@x.com", password: "password123", name: "Cy" })).json();
  assert.equal(C.user.household, A.user.household);
  assert.equal((await (await get("/api/archive", C.token)).json()).memories.length, 1);
  assert.equal((await post("/api/auth/join", { code: inv.code, email: "d@x.com", password: "password123" })).status, 400, "codes are single use");
  const me = await (await get("/api/auth/me", C.token)).json();
  assert.equal(me.members.length, 2);
  assert.equal((await post("/api/devices", { label: "x" }, C.token)).status, 403, "members cannot add devices");

  // device tokens: work for the voice pipeline and MCP, and can be revoked
  const dev = await (await post("/api/devices", { label: "Kitchen Hearth" }, A.token)).json();
  const out = await say(dev.token, "who has shared stories?", "dev");
  assert.match(out.reply, /Ann/);
  const list = await (await get("/api/devices", A.token)).json();
  assert.equal(list.devices.length, 1);
  assert.equal((await fetch(B + "/api/devices/" + dev.id, { method: "DELETE", headers: { authorization: "Bearer " + A.token } })).status, 200);
  assert.equal((await get("/api/archive", dev.token)).status, 401);
});

test("demo sandbox: no sign-up, private, seeded, cannot invite", async () => {
  const g1 = await (await post("/api/auth/demo")).json(), g2 = await (await post("/api/auth/demo")).json();
  assert.notEqual(g1.household.id, g2.household.id);
  const a1 = await (await get("/api/archive", g1.token)).json();
  assert.ok(a1.memories.length >= 7);
  await post("/api/say", { session: "g", utterance: "I want to tell you a story", teller: "Maya" }, g1.token);
  await post("/api/say", { session: "g", utterance: "In 2001 we visited Accra and I was proud.", teller: "Maya" }, g1.token);
  await post("/api/say", { session: "g", utterance: "that's all", teller: "Maya" }, g1.token);
  assert.equal((await (await get("/api/archive", g1.token)).json()).memories.length, a1.memories.length + 1);
  assert.equal((await (await get("/api/archive", g2.token)).json()).memories.length, a1.memories.length, "sandboxes are isolated");
  assert.equal((await post("/api/auth/invite", {}, g1.token)).status, 403);
  const g3 = await (await post("/api/auth/demo?lang=zh")).json();
  assert.equal((await (await get("/api/archive", g3.token)).json()).memories.length, 3);
});

test("accounts data is not reachable through the household header (legacy mode)", async () => {
  process.env.LEGACYLINK_ACCOUNTS = "";
  const arch = await (await get("/api/archive", "", { "x-household": "_users" })).json();
  process.env.LEGACYLINK_ACCOUNTS = "1";
  assert.ok(!JSON.stringify(arch).includes("hash"));
});
