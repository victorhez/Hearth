// Stage 1: have the real conversations with the real server, synthesize every voice, measure it, and write out/timeline.json.
//   node video/prepare.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { synth } from "./voices.mjs";
import { recordConversation, beatsFrom } from "./storyboard.mjs";

const here = path.dirname(fileURLToPath(import.meta.url)), root = path.join(here, ".."), OUT = path.join(here, "out"), AUDIO = path.join(OUT, "audio");
fs.mkdirSync(AUDIO, { recursive: true });
const PORT = 3390, base = `http://127.0.0.1:${PORT}`, FPS = 30;

// --- real server on a throwaway data dir, family-time shortened to 2 rounds for the film
const data = fs.mkdtempSync(path.join(os.tmpdir(), "ll-film-"));
const srv = spawn(process.execPath, ["src/server.mjs"], { cwd: root, env: { ...process.env, PORT: String(PORT), LEGACYLINK_DATA_DIR: data, LEGACYLINK_FAMILY_ROUNDS: "2", LEGACYLINK_ACCOUNTS: "", NODE_ENV: "" }, stdio: "ignore" });
for (let i = 0; i < 60; i++) { try { if ((await fetch(base + "/health")).ok) break; } catch {} await new Promise((r) => setTimeout(r, 250)); }
await fetch(base + "/api/demo/reset?lang=ng", { method: "POST", headers: { "x-household": "home" } });
console.log("recording the real conversations...");
const conv = await recordConversation(base);
srv.kill();
fs.rmSync(data, { recursive: true, force: true });

const beats = beatsFrom(conv);
console.log(beats.length, "beats");

// --- voices (cached by content so reruns are fast)
const keyOf = (b) => crypto.createHash("sha1").update(JSON.stringify([b.speak, b.spec])).digest("hex").slice(0, 16);
let n = 0;
for (const b of beats) {
  const raw = path.join(AUDIO, keyOf(b) + ".mp3"); b.file = raw.replace(/\.mp3$/, ".trim.mp3");
  if (!fs.existsSync(raw)) fs.writeFileSync(raw, await synth(b.speak, b.spec));
  if (!fs.existsSync(b.file)) { // trim the silence the TTS leaves at both ends so the dialogue flows
    const f = "silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.04,areverse,silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.07,areverse";
    const r = spawnSync("ffmpeg", ["-y", "-v", "error", "-i", raw, "-af", f, "-ar", "24000", "-b:a", "96k", b.file]);
    if (r.status !== 0 || !fs.existsSync(b.file)) fs.copyFileSync(raw, b.file);
  }
  process.stdout.write(`\rvoices ${++n}/${beats.length}`);
}
console.log();

// --- measure: duration + loudness envelope (30 fps) used for lip-sync and the orb
function probe(file) {
  const d = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { encoding: "utf8" });
  return parseFloat(d.stdout);
}
function envelope(file) {
  const r = spawnSync("ffmpeg", ["-v", "error", "-i", file, "-f", "s16le", "-ac", "1", "-ar", "8000", "-"], { maxBuffer: 1 << 28 });
  const pcm = new Int16Array(r.stdout.buffer, r.stdout.byteOffset, Math.floor(r.stdout.byteLength / 2)), w = Math.floor(8000 / FPS), env = [];
  for (let i = 0; i + w <= pcm.length; i += w) { let s = 0; for (let k = 0; k < w; k++) s += pcm[i + k] * pcm[i + k]; env.push(Math.sqrt(s / w)); }
  const sorted = [...env].sort((a, b) => a - b), peak = sorted[Math.floor(sorted.length * 0.95)] || 1;
  return env.map((v) => Math.min(1, +(v / peak).toFixed(2)));
}

// --- timeline
let t = 2.0; // title card first
const OPEN = 2.0;
for (const b of beats) { b.dur = probe(b.file); b.env = envelope(b.file); b.start = t; b.end = t + b.dur; t = b.end + b.gap; }
const total = t + 2.4; // end card tail
const sceneRange = {};
for (const b of beats) { const r = (sceneRange[b.scene] ||= { start: b.start, end: b.end }); r.end = b.end; }

// --- sound effects keyed to cues
const sfx = [];
for (const b of beats) {
  if (b.cue === "wake") sfx.push({ t: b.end + 0.02, kind: "wake" });
  if (b.cue === "recognise") sfx.push({ t: b.start - 0.05, kind: "ding" });
  if (b.cue === "cheer") sfx.push({ t: b.start + 0.1, kind: "ding" });
  if (b.cue === "star") sfx.push({ t: b.start + 0.3, kind: "star" });
}

const allCalls = beats.flatMap((b) => (b.calls || []).map((c) => ({ tool: c.tool, args: c.args, beatStart: b.start })));
const slim = (o) => JSON.parse(JSON.stringify(o, (k, v) => (typeof v === "string" && v.length > 140 ? v.slice(0, 137) + "..." : v)));
fs.writeFileSync(path.join(OUT, "timeline.json"), JSON.stringify({
  fps: FPS, open: OPEN, total, scenes: sceneRange, sfx,
  beats: beats.map(({ scene, who, text, lang, cue, name, sub, calls, start, end, dur, env, file }) => ({ scene, who, text, lang, cue, name, sub, tools: (calls || []).slice(0, 3).map((c) => ({ tool: c.tool, args: JSON.stringify(c.args).slice(0, 70) })), start, end, dur, env, file: path.relative(OUT, file) })),
  calls: slim(allCalls).slice(0, 40),
  memories: conv.archive.memories.map((m) => ({ id: m.id, title: m.title, teller: m.teller, dates: m.dates, places: m.places, people: m.people, emotions: m.emotions })),
  timelineData: conv.archive.timeline,
  savedStory: conv.b4.saved, savedMessage: conv.e4.saved,
}));
console.log(`timeline ready: ${total.toFixed(1)} s (${Math.floor(total / 60)}:${String(Math.round(total % 60)).padStart(2, "0")}) ${total > 178 ? " <-- TOO LONG, trim the storyboard" : ""}`);
