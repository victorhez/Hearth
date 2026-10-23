// LegacyLink / Hearth backend
//   POST /mcp              MCP server (Streamable HTTP, stateless)
//   POST /api/say          voice turn: utterance -> reply + the MCP tool calls behind it
//   GET  /api/archive      memories, timeline, graph, daily prompt (for the UI)
//   /api/device/*          live state channel so the Hearth screen mirrors the physical device
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { buildServer } from "./tools.mjs";
import { handle } from "./brain.mjs";
import * as N from "./nlp.mjs";
import * as AI from "./llm.mjs";
import { dynamodbConfigured, forHousehold, upstashConfigured } from "./store.mjs";
import { seedHousehold } from "./seed.mjs";
import { synthesize } from "./tts.mjs";
import { S, UI, LANGS, CODES } from "./i18n.mjs";
import "./i18n2.mjs";
import { accountsOn, resolve, isRevoked, mountAuth, sweepDemos } from "./auth.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const TOKEN = process.env.LEGACYLINK_TOKEN || "";
const hh = (req) => { const h = req.hh || String(req.get("x-household") || req.query.household || "home"); return h.startsWith("_") ? "home" : h; }; // "_" names are reserved for accounts data
const bearer = (req) => (req.get("authorization") || "").replace(/^Bearer /, "") || String(req.query.token || "");

export function createApp(app = express()) {
  app.use(express.json({ limit: "1mb" }));
  app.use((_req, res, next) => {
    if (!process.env.VERCEL) return next();
    const missing = [];
    if (!upstashConfigured() && !dynamodbConfigured()) missing.push("configure persistent storage with Upstash or DynamoDB");
    if (dynamodbConfigured() && !process.env.AWS_ROLE_ARN && !process.env.AWS_ACCESS_KEY_ID) missing.push("configure AWS_ROLE_ARN or AWS access credentials");
    if (!accountsOn()) missing.push("set LEGACYLINK_ACCOUNTS=1");
    if (!process.env.LEGACYLINK_SECRET) missing.push("set LEGACYLINK_SECRET");
    if (missing.length) return res.status(503).json({ error: "Vercel deployment is not configured", missing });
    next();
  });

  // accounts mode: the household comes from a signed token (never from a client header).
  // shared-token mode (default): optional LEGACYLINK_TOKEN + x-household header, handy for local use.
  const auth = async (req, res, next) => {
    if (accountsOn()) {
      const p = resolve(req);
      if (!p || (await isRevoked(p))) return res.status(401).json({ error: "sign in required" });
      req.hh = p.hh; req.principal = p; return next();
    }
    if (!TOKEN) return next();
    return bearer(req) === TOKEN ? next() : res.status(401).json({ error: "unauthorized" });
  };
  mountAuth(app, express);

  app.get("/health", (_q, r) => r.json({ ok: true, llm: AI.enabled() ? "bedrock" : "local", store: dynamodbConfigured() ? "dynamodb" : upstashConfigured() ? "upstash" : "file", accounts: accountsOn() }));

  app.post("/mcp", auth, async (req, res) => {
    const server = buildServer(hh(req));
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("close", () => { transport.close(); server.close(); });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });
  const noGet = (_q, r) => r.status(405).json({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed" }, id: null });
  app.get("/mcp", noGet); app.delete("/mcp", noGet);

  app.post("/api/say", auth, async (req, res) => {
    const { session = "default", utterance = "", teller = "Grandma Rose", lang = "en", speaker } = req.body || {};
    try {
      const out = await handle({ sid: `${hh(req)}:${session}`, utterance: String(utterance), teller, lang, speaker, household: hh(req), token: accountsOn() ? bearer(req) : TOKEN });
      publish(hh(req), { type: "reply", ...out });
      res.json(out);
    } catch (e) { console.error(e); res.status(500).json({ reply: "Sorry, something went wrong on my end.", calls: [], error: String(e) }); }
  });

  app.get("/api/archive", auth, async (req, res) => {
    const mems = await forHousehold(hh(req)).all();
    res.json({ memories: mems.slice().reverse(), timeline: N.timeline(mems), graph: N.graph(mems), prompt: N.dailyPrompt(new Date(), String(req.query.lang || "en")) });
  });

  // device state fan-out (SSE) so any screen can mirror the hardware
  const subs = new Map();
  const publish = (h, ev) => (subs.get(h) || []).forEach((r) => r.write(`data: ${JSON.stringify(ev)}\n\n`));
  app.get("/api/device/events", auth, (req, res) => {
    if (process.env.VERCEL) return res.status(204).end();
    res.set({ "content-type": "text/event-stream", "cache-control": "no-cache", connection: "keep-alive" }); res.flushHeaders();
    const h = hh(req); subs.set(h, [...(subs.get(h) || []), res]);
    req.on("close", () => subs.set(h, (subs.get(h) || []).filter((r) => r !== res)));
  });
  app.post("/api/device/state", auth, (req, res) => { publish(hh(req), { type: "state", ...req.body }); res.json({ ok: true }); });

  app.get("/api/i18n", (req, res) => {
    const l = CODES.includes(req.query.lang) ? req.query.lang : "en";
    const ui = { ...UI[l] }; ui.count = UI[l].count(":m", ":v");
    res.json({ lang: l, langs: CODES.map((c) => ({ code: c, native: LANGS[c].native, sr: LANGS[c].sr })), ui, hello: S[l].hello, here: S[l].here, reactions: S[l].reactions, enroll: { sample: S[l].enroll.sample, done: S[l].enroll.done(":n") } });
  });

  app.get("/api/tts", auth, async (req, res) => {
    const r = await synthesize(String(req.query.text || ""), String(req.query.who || "hearth"), String(req.query.lang || "en"));
    if (!r) return res.status(204).end();
    res.set({ "content-type": "audio/mpeg", "cache-control": "private, max-age=3600", "x-tts-provider": r.provider }).send(r.mp3);
  });

  // Demo helper (disabled in production): reset a household to the fictional seed family.
  app.post("/api/demo/reset", auth, async (req, res) => {
    // accounts mode: only a visitor's own sandbox may be reset. Never a real family. Production without accounts: disabled.
    if (accountsOn() ? req.principal?.role !== "guest" : process.env.NODE_ENV === "production") return res.status(403).json({ error: "disabled" });
    res.json({ seeded: await seedHousehold(hh(req), String(req.query.lang || "")) });
  });

  app.use(express.static(path.join(here, "..", "public")));
  return app;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = process.env.PORT || 3333;
  setInterval(sweepDemos, 3600e3).unref();
  createApp().listen(port, () => console.log(`LegacyLink  MCP http://localhost:${port}/mcp   Hearth http://localhost:${port}/`));
}
