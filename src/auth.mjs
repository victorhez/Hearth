// Accounts: sign-up / login (scrypt), family invites, device tokens, per-visitor demo sandboxes.
// Off by default (shared-token mode). Turn on with LEGACYLINK_ACCOUNTS=1 and set LEGACYLINK_SECRET.
// Users/households/invites/devices live in the same storage backend as memories, under reserved "_" households.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { forHousehold, DATA_DIR } from "./store.mjs";
import { seedHousehold } from "./seed.mjs";

const scrypt = promisify(crypto.scrypt);
const b64 = (b) => Buffer.from(b).toString("base64url");
export const accountsOn = () => process.env.LEGACYLINK_ACCOUNTS === "1";

let _secret;
function secret() {
  if (_secret) return _secret;
  if (process.env.LEGACYLINK_SECRET) return (_secret = process.env.LEGACYLINK_SECRET);
  if (process.env.NODE_ENV === "production") throw new Error("LEGACYLINK_SECRET must be set in production");
  const f = path.join(DATA_DIR, ".secret");
  try { return (_secret = fs.readFileSync(f, "utf8")); } catch { /* generate below */ }
  _secret = crypto.randomBytes(32).toString("hex");
  try { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, _secret); } catch {}
  return _secret;
}

export function signToken(payload) {
  const body = b64(JSON.stringify(payload));
  return `lg1.${body}.${crypto.createHmac("sha256", secret()).update(body).digest("base64url")}`;
}
export function verifyToken(tok) {
  const [v, body, sig] = String(tok || "").split(".");
  if (v !== "lg1" || !body || !sig) return null;
  const good = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  if (sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  try { const p = JSON.parse(Buffer.from(body, "base64url").toString()); return p.exp && p.exp < Date.now() ? null : p; } catch { return null; }
}

async function hashPw(pw, salt = crypto.randomBytes(16).toString("hex")) {
  return { salt, hash: (await scrypt(pw, salt, 64)).toString("hex") };
}
async function checkPw(pw, u) {
  const { hash } = await hashPw(pw, u.salt);
  return hash.length === u.hash.length && crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(u.hash));
}

const users = forHousehold("_users"), houses = forHousehold("_households"), invites = forHousehold("_invites"), devices = forHousehold("_devices");
const rid = (p) => p + crypto.randomBytes(6).toString("hex");
const emailKey = (e) => String(e || "").trim().toLowerCase();
const pub = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, household: u.household });

// tiny in-memory rate limiter (per IP + route)
const hits = new Map();
const limited = (req, max = 12, windowMs = 60000) => {
  const k = req.ip + req.path, now = Date.now(), a = (hits.get(k) || []).filter((t) => now - t < windowMs);
  a.push(now); hits.set(k, a); return a.length > max;
};

export function sessionFor(u) {
  return { token: signToken({ sub: u.id, hh: u.household, role: u.role, exp: Date.now() + 30 * 864e5 }), user: pub(u) };
}

// Express middleware: resolves req.hh (household) and req.user from a Bearer token.
export function resolve(req) {
  const t = (req.get("authorization") || "").replace(/^Bearer /, "") || req.query.token;
  return verifyToken(t);
}

export async function isRevoked(p) {
  if (!p.dev) return false;
  return !(await devices.all()).some((d) => d.id === p.dev);
}

export function mountAuth(app, express) {
  const json = express.json({ limit: "20kb" });
  const bad = (res, code, msg) => res.status(code).json({ error: msg });

  app.post("/api/auth/signup", json, async (req, res) => {
    if (!accountsOn()) return bad(res, 404, "accounts disabled");
    if (limited(req)) return bad(res, 429, "too many attempts");
    const { email, password, name, householdName } = req.body || {};
    if (!/^\S+@\S+\.\S+$/.test(email || "") || String(password || "").length < 8) return bad(res, 400, "valid email and a password of 8+ characters required");
    if ((await users.all()).some((u) => u.email === emailKey(email))) return bad(res, 409, "email already registered");
    const household = rid("h_"), { salt, hash } = await hashPw(password);
    const user = { id: rid("u_"), email: emailKey(email), name: String(name || email.split("@")[0]).slice(0, 40), salt, hash, household, role: "owner", createdAt: new Date().toISOString() };
    await users.add(user);
    await houses.add({ id: household, name: String(householdName || `${user.name}'s family`).slice(0, 60), ownerId: user.id, createdAt: user.createdAt });
    res.json({ ...sessionFor(user), household: { id: household, name: householdName } });
  });

  app.post("/api/auth/login", json, async (req, res) => {
    if (!accountsOn()) return bad(res, 404, "accounts disabled");
    if (limited(req)) return bad(res, 429, "too many attempts");
    const { email, password } = req.body || {};
    const u = (await users.all()).find((x) => x.email === emailKey(email));
    if (!u || !(await checkPw(String(password || ""), u))) return bad(res, 401, "wrong email or password");
    res.json(sessionFor(u));
  });

  const need = async (req, res) => {
    const p = resolve(req);
    if (!p || p.dev || (await isRevoked(p))) { bad(res, 401, "sign in required"); return null; }
    if (p.sub === "guest") return { id: "guest", name: "Guest", role: "guest", household: p.hh };
    const u = (await users.all()).find((x) => x.id === p.sub);
    if (!u) { bad(res, 401, "unknown user"); return null; }
    return u;
  };

  app.get("/api/auth/me", async (req, res) => {
    const u = await need(req, res); if (!u) return;
    const h = u.role === "guest" ? { id: u.household, name: "Demo family (sandbox)" } : (await houses.all()).find((x) => x.id === u.household);
    const members = (await users.all()).filter((x) => x.household === u.household).map((x) => ({ name: x.name, role: x.role }));
    res.json({ user: pub(u), household: h, members });
  });

  app.post("/api/auth/invite", json, async (req, res) => {
    const u = await need(req, res); if (!u) return;
    if (u.role === "guest") return bad(res, 403, "create a family account to invite people");
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    await invites.add({ id: code, household: u.household, by: u.id, createdAt: new Date().toISOString(), expires: Date.now() + 7 * 864e5 });
    res.json({ code, expiresInDays: 7 });
  });

  app.post("/api/auth/join", json, async (req, res) => {
    if (!accountsOn()) return bad(res, 404, "accounts disabled");
    if (limited(req)) return bad(res, 429, "too many attempts");
    const { code, email, password, name } = req.body || {};
    const inv = (await invites.all()).find((i) => i.id === String(code || "").trim().toUpperCase());
    if (!inv || inv.expires < Date.now()) return bad(res, 400, "invite code invalid or expired");
    if (!/^\S+@\S+\.\S+$/.test(email || "") || String(password || "").length < 8) return bad(res, 400, "valid email and a password of 8+ characters required");
    if ((await users.all()).some((u) => u.email === emailKey(email))) return bad(res, 409, "email already registered");
    const { salt, hash } = await hashPw(password);
    const user = { id: rid("u_"), email: emailKey(email), name: String(name || email.split("@")[0]).slice(0, 40), salt, hash, household: inv.household, role: "member", createdAt: new Date().toISOString() };
    await users.add(user); await invites.remove(inv.id);
    res.json(sessionFor(user));
  });

  // device tokens: long-lived, revocable, owner only
  app.post("/api/devices", json, async (req, res) => {
    const u = await need(req, res); if (!u) return;
    if (u.role !== "owner") return bad(res, 403, "only the family owner can add devices");
    const id = rid("d_"), label = String(req.body?.label || "Hearth device").slice(0, 40);
    await devices.add({ id, household: u.household, label, createdAt: new Date().toISOString() });
    res.json({ id, label, token: signToken({ dev: id, hh: u.household, exp: Date.now() + 5 * 365 * 864e5 }) });
  });
  app.get("/api/devices", async (req, res) => {
    const u = await need(req, res); if (!u) return;
    res.json({ devices: (await devices.all()).filter((d) => d.household === u.household).map(({ id, label, createdAt }) => ({ id, label, createdAt })) });
  });
  app.delete("/api/devices/:id", async (req, res) => {
    const u = await need(req, res); if (!u) return;
    if (u.role !== "owner") return bad(res, 403, "only the family owner can remove devices");
    const d = (await devices.all()).find((x) => x.id === req.params.id && x.household === u.household);
    if (!d) return bad(res, 404, "no such device");
    await devices.remove(d.id); res.json({ ok: true });
  });

  // judges / visitors: a private sandbox family, no sign-up. File backend only cleans up after itself.
  app.post("/api/auth/demo", async (req, res) => {
    if (!accountsOn()) return bad(res, 404, "accounts disabled");
    if (limited(req, 20, 60000)) return bad(res, 429, "too many attempts");
    const household = "demo-" + crypto.randomBytes(5).toString("hex");
    await seedHousehold(household, String(req.query.lang || ""));
    res.json({ token: signToken({ sub: "guest", hh: household, role: "guest", exp: Date.now() + 24 * 3600e3 }), user: { name: "Guest", role: "guest", household }, household: { id: household, name: "Demo family (sandbox)" } });
  });

  app.get("/api/config", (_q, res) => res.json({ accounts: accountsOn() }));
}

// remove abandoned demo sandboxes (file backend)
export function sweepDemos(dir = DATA_DIR) {
  try { for (const f of fs.readdirSync(dir)) if (/^demo-[a-f0-9]+\.json$/.test(f) && Date.now() - fs.statSync(path.join(dir, f)).mtimeMs > 24 * 3600e3) fs.unlinkSync(path.join(dir, f)); } catch {}
}
