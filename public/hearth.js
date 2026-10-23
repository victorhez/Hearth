import { Hearth } from "./orb.js";
import { Voice } from "./voice.js";

const $ = (id) => document.getElementById(id);
const qs = new URLSearchParams(location.search);
import { session } from "./session.js";
const device = qs.get("device") === "1"; // mirror a physical Hearth instead of using this browser's mic
const { token, headers, household, me } = await session();
const sid = "web-" + Math.random().toString(36).slice(2, 8);

const orb = new Hearth($("stage"));
const voice = new Voice();
let lang = qs.get("lang") || localStorage.getItem("hl-lang") || ({ es: "es", fr: "fr", zh: "zh", pt: "pt", de: "de", hi: "hi" })[navigator.language.slice(0, 2)] || "en";
let ui = { sleeping: "Sleeping", listening: "Listening", thinking: "Thinking", speaking: "Speaking", idle: "", awake: "", story: "", tips: [], count: "", tap: "" };
let helloText = "Hello.", hereText = "I'm here.", teller = qs.get("teller") || (me && me.user.role !== "guest" ? me.user.name : "Grandma Rose"), tellers = [], mode = "idle", awake = false, busy = false;
let buf = [], bufTimer = null, sleepTimer = null, level = 0, sayTimers = [], memCount = 0, tip = 0, loud = 0;

const LBL = { idle: "sleeping", listening: "listening", thinking: "thinking", speaking: "speaking" };
const setState = (s, mood) => { orb.set(s, mood); $("state").textContent = ui[LBL[s]] || s; $("dot").classList.toggle("on", s !== "idle"); };
const hint = (t) => { $("hint").textContent = t; };
const idleHint = () => hint(busy ? "" : awake ? (mode === "story" ? ui.story : ui.awake) : ui.idle);
setInterval(() => { if (!awake && !busy && ui.tips.length) hint(ui.tips[++tip % ui.tips.length]); }, 7000);

// ---- language ----
async function loadI18n(l) {
  const r = await fetch("/api/i18n?lang=" + l).then((x) => x.json());
  lang = r.lang; ui = r.ui; helloText = r.hello; hereText = r.here; localStorage.setItem("hl-lang", lang); document.documentElement.lang = lang;
  voice.lang = r.langs.find((x) => x.code === lang).sr;
  const box = $("langs"); box.innerHTML = "";
  for (const x of r.langs) { const b = document.createElement("button"); b.textContent = x.native; b.className = x.code === lang ? "on" : ""; b.onclick = () => switchLang(x.code); box.append(b); }
  $("gateTap").textContent = ui.gate; $("gateThen").textContent = ui.then;
  $("count").textContent = ui.count.replace(":m", memCount).replace(":v", tellers.length);
  setState(orb.state, orb.mood); idleHint();
}
async function switchLang(l) { await loadI18n(l); voice.restartRec(); if (voice.alive) { wake(true); speakOnly(helloText); } }

// ---- earcons ----
function tone(f0, f1, dur, gain) {
  try {
    const c = (window.__chime ||= new (window.AudioContext || window.webkitAudioContext)()), t = c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.8); o.connect(g); g.connect(c.destination);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.start(t); o.stop(t + dur + 0.05);
  } catch {}
}
const chime = (up) => { tone(up ? 660 : 660, up ? 990 : 440, 0.35, 0.07); };
function murmur() { orb.nod(); tone(220, 180, 0.35, 0.035); } // soft "mm-hm": the speaker feels heard without being interrupted

// ---- wake / sleep ----
function wake(on) {
  if (on !== awake) chime(on);
  awake = on; orb.awake = on; clearTimeout(sleepTimer);
  if (on) setState("listening"); else { setState("idle"); mode = "idle"; $("you").textContent = ""; }
  idleHint();
}
const armSleep = (ms = 16000) => { clearTimeout(sleepTimer); if (["story", "quiz", "family", "confirm", "enroll"].includes(mode)) return; sleepTimer = setTimeout(() => wake(false), ms); };

// ---- archive + who ----
async function loadArchive() {
  const a = await fetch("/api/archive?lang=" + lang, { headers }).then((r) => r.json());
  orb.setMemories(a.memories, a.timeline);
  tellers = [...new Set(a.memories.map((m) => m.teller))]; memCount = a.memories.length;
  $("count").textContent = ui.count.replace(":m", memCount).replace(":v", tellers.length);
  renderWho(); return a;
}
function renderWho() {
  const w = $("who"); w.innerHTML = "";
  for (const t of [...new Set([...tellers.slice(0, 6), teller])]) { const b = document.createElement("button"); b.textContent = t; b.className = t === teller ? "on" : ""; b.onclick = () => { teller = t; renderWho(); }; w.append(b); }
}

// ---- captions ----
function showReply(text) {
  sayTimers.forEach(clearTimeout); sayTimers = [];
  const el = $("say"); el.innerHTML = "";
  const cjk = /[\u3400-\u9fff]/.test(text), parts = cjk ? [...text] : text.split(/\s+/), joiner = cjk ? "" : " ";
  const words = parts.map((w) => { const s = document.createElement("span"); s.textContent = w + joiner; el.append(s); return s; });
  const starts = []; let o = 0; for (const w of parts) { starts.push(o); o += w.length + joiner.length; }
  const reveal = (i) => words.forEach((s, k) => s.classList.toggle("on", k <= i));
  if (device) { words.forEach((s, k) => sayTimers.push(setTimeout(() => reveal(k), k * 220))); return; }
  reveal(0);
  const onWord = (e) => { let i = 0; while (i + 1 < starts.length && starts[i + 1] <= e.detail) i++; reveal(i); level = 1; };
  voice.addEventListener("word", onWord);
  voice.addEventListener("speakend", () => { voice.removeEventListener("word", onWord); reveal(words.length); }, { once: true });
}

function showCalls(calls, engine) {
  const box = $("calls");
  $("engine").textContent = engine === "bedrock-agent" ? "Claude on Amazon Bedrock · MCP" : "Local engine · MCP";
  calls.slice(-3).forEach((c, i) => {
    const d = document.createElement("div"); d.className = "call engine-" + (engine === "bedrock-agent" ? "bedrock" : "local"); d.style.animationDelay = i * 0.18 + "s";
    const args = JSON.stringify(c.args).slice(0, 70), res = JSON.stringify(c.result).replace(/[{}"\\]/g, "").slice(0, 90);
    d.innerHTML = `<b></b><small></small><small></small>`; d.children[0].textContent = "tools/call · " + c.tool; d.children[1].textContent = "→ " + args; d.children[2].textContent = "← " + res;
    box.prepend(d); while (box.children.length > 4) box.lastChild.remove();
    setTimeout(() => { d.style.opacity = 0; setTimeout(() => d.remove(), 1000); }, 14000);
  });
}

// ---- conversation ----
async function send(utterance) {
  utterance = utterance.trim(); if (!utterance || busy) return;
  const m = utterance.match(/^(?:this is|it'?s|i am|i'm|my name is)\s+([a-z ]+?)\.?$/i);
  if (m) { const who = tellers.find((t) => t.toLowerCase().includes(m[1].toLowerCase())); if (who) { teller = who; renderWho(); return speakOnly(`${who}.`); } }
  busy = true; $("you").textContent = "“" + utterance + "”"; setState("thinking"); hint("");
  let out;
  try { out = await fetch("/api/say", { method: "POST", headers, body: JSON.stringify({ session: sid, utterance, teller, lang }) }).then((r) => r.json()); }
  catch { out = { reply: "…", calls: [] }; }
  showCalls(out.calls || [], out.engine);
  for (const c of out.calls || []) { const id = c.result?.memory?.id || c.result?.matches?.[0]?.id || c.result?.id; if (id) orb.highlight(id); }
  if (out.story) orb.highlight(out.story);
  if (out.saved) await loadArchive().then(() => orb.highlight(out.saved, 9000));
  if (out.lang && out.lang !== lang) { await loadI18n(out.lang); voice.restartRec(); }
  if (out.teller && out.teller !== teller) { teller = out.teller; renderWho(); }
  mode = out.mode || "idle"; if (out.nod) orb.nod();
  await speakOnly(out.reply, out.mood);
  busy = false; idleHint();
}

async function speakOnly(text, mood) {
  setState("speaking", mood === "joy" ? "joy" : null); hint(ui.tap); showReply(text);
  if (!device) await voice.speak(text, "hearth", { token, lang }); else await new Promise((r) => setTimeout(r, 400 + text.length * 60));
  setState(awake ? "listening" : "idle"); idleHint(); armSleep();
}

function onSpeech(text, final) {
  if (busy || voice.speaking) return;
  const w = Voice.stripWake(text);
  if (!awake) {
    if (!w.woke) return;
    wake(true);
    if (!final) { $("you").textContent = "“" + (w.rest || "…") + "”"; return; }
    if (w.rest) queue(w.rest); else { $("you").textContent = ""; speakOnly(hereText); }
    return;
  }
  const t = w.woke ? w.rest : text;
  $("you").textContent = "“" + buf.concat(t).join(" ") + "”"; orb.set("listening"); clearTimeout(sleepTimer);
  if (final && t) queue(t); else if (!final) clearTimeout(bufTimer);
}
function queue(t) {
  buf.push(t); clearTimeout(bufTimer);
  const done = /(that'?s (all|it)|i'?m done|the end|nothing else|eso es todo|c'est tout|就这些|说完了|é só isso|das war'?s|बस इतना)\W*$/i.test(t);
  if (mode === "story" && !done) murmur();
  bufTimer = setTimeout(() => { const u = buf.join(" "); buf = []; send(u); }, done ? 150 : mode === "story" ? 3400 : 750);
}

// interrupt Hearth by tapping the orb / pressing space, or simply by talking over it
function interrupt() { if (voice.speaking) { voice.stopSpeaking(); wake(true); } }
$("stage").addEventListener("click", () => { if (voice.speaking) interrupt(); });

function loop() {
  const live = voice.alive && orb.state === "listening";
  if (live) orb.setLevel(voice.level());
  else if (orb.state === "speaking") {
    const o = voice.outLevel(); level *= 0.9; orb.setLevel(Math.max(o, level * 0.5) + 0.08);
    // barge-in: a voice clearly louder than Hearth's own bleed-through for ~0.5 s takes the floor
    const mic = voice.alive ? voice.level() : 0;
    loud = mic > o * 1.3 + 0.32 ? loud + 1 : 0;
    if (loud > 30) { loud = 0; interrupt(); }
  } else if (orb.state === "thinking") orb.setLevel(0.22); else orb.setLevel(0.04);
  requestAnimationFrame(loop);
}

// ---- boot ----
orb.getSpectrum = () => voice.spectrum();
const typed = (e) => { if (e.key === "Enter") { wake(true); send(e.target.value); e.target.value = ""; } };
if ((!voice.supported && !device) || qs.get("type") === "1") { $("typebox").style.display = "block"; $("type").onkeydown = typed; }
voice.addEventListener("interim", (e) => onSpeech(e.detail, false));
voice.addEventListener("final", (e) => onSpeech(e.detail, true));
voice.addEventListener("error", (e) => hint(e.detail));
await loadI18n(lang); loadArchive(); loop(); idleHint();

function enter() {
  $("gate").style.opacity = 0; setTimeout(() => $("gate").remove(), 600);
  if (!device) voice.start();
  setState("idle"); idleHint();
  if (!device) setTimeout(() => speakOnly(helloText), 500);
}
$("gate").onclick = enter;
addEventListener("keydown", (e) => { if (e.code === "Space" && !(e.target instanceof HTMLInputElement)) { e.preventDefault(); if (voice.speaking) interrupt(); else wake(!awake); } });

if (device) { // mirror mode: the Raspberry Pi owns the audio; this screen visualises its state
  $("gate").remove(); setState("idle");
  const es = new EventSource("/api/device/events?household=" + household + (token ? "&token=" + token : ""));
  es.onmessage = (m) => {
    const ev = JSON.parse(m.data);
    if (ev.type === "state") {
      awake = ev.state !== "idle"; orb.awake = awake; setState(ev.state, ev.mood);
      if (ev.text) $("you").textContent = "“" + ev.text + "”"; if (typeof ev.level === "number") orb.setLevel(ev.level);
      if (ev.reply) showReply(ev.reply);
    } else if (ev.type === "reply") {
      showCalls(ev.calls || [], ev.engine); if (ev.story) orb.highlight(ev.story); if (ev.saved) loadArchive().then(() => orb.highlight(ev.saved, 9000)); if (ev.nod) orb.nod();
      showReply(ev.reply);
    }
  };
}
