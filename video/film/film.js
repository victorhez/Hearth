// The film as a pure function of time: window.render(t) draws exactly the frame at second t.
import { Hearth } from "/p/orb.js";
import * as A from "./art.js";

const TL = await (await fetch("/out/timeline.json")).json();
const $ = (id) => document.getElementById(id);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const lerp = (a, b, k) => a + (b - a) * k;
const FPS = TL.fps, OPEN = TL.open, beats = TL.beats;
const scenes = Object.entries(TL.scenes).map(([k, v]) => ({ k, ...v })).sort((a, b) => a.start - b.start);
const S = TL.scenes;

// ---------------------------------------------------------------- build the world
const people = ["grandma", "papa", "tunde", "chioma", "mireille"].map((id) => `<g id="p-${id}">${A.person(id, A.PEOPLE[id])}</g>`).join("");
$("art").innerHTML = A.DEFS + A.KITCHEN_BACK + A.COUNTER + A.FLOOR +
  `<g id="steam"></g><ellipse id="devHalo" cx="960" cy="540" rx="190" ry="190" fill="#f0b86a" opacity="0" filter="url(#soft)"/>
   <g id="devWrap" transform="translate(960 640)">${A.DEVICE}</g><g id="spark"></g>` + people + A.TABLE +
  `<g id="memCards"></g><rect width="1920" height="1080" fill="url(#vig)"/>`;
$("insideSvg").innerHTML = A.INSIDE;
const gp = $("gpio"); if (gp) { let g = ""; for (let r = 0; r < 2; r++) for (let i = 0; i < 20; i++) g += `<rect x="${-150 + i * 7.5}" y="${-52 + r * 8}" width="5" height="5" fill="#111"/>`; gp.innerHTML = g; }

// orbs: TV on the wall, the phone, the title and end cards
const tvOrb = new Hearth($("tvCv")), phOrb = new Hearth($("phCv")), bigOrb = new Hearth($("bigCv")), endOrb = new Hearth($("endCv"));
// only draw an orb while it is on screen (hidden ones would waste memory and time)
for (const o of [tvOrb, phOrb, bigOrb, endOrb]) { const f = o.frame.bind(o); o.__vis = true; o.frame = (now) => { if (!o.__vis) { requestAnimationFrame((t) => o.frame(t)); return; } f(now); }; }
const byId = Object.fromEntries(TL.memories.map((m) => [m.id, m]));
const initial = TL.memories.filter((m) => m.id !== TL.savedStory && m.id !== TL.savedMessage), withStory = TL.memories.filter((m) => m.id !== TL.savedMessage);
const mk = (list) => ({ list, tl: TL.timelineData.filter((x) => list.some((m) => m.id === x.id)) });
tvOrb.setMemories(...Object.values(mk(initial)).slice(0, 2)); tvOrb.awake = false;
phOrb.awake = true; bigOrb.awake = true; endOrb.awake = true;
const christmas = TL.memories.find((m) => /Christmas/.test(m.title));

// ---------------------------------------------------------------- helpers
const POS = { grandma: 400, papa: 770, tunde: 1140, chioma: 1380, mireille: 1640 };
const langBeat = beats.find((b) => b.who === "mireille");
const PRES = { grandma: [[S.problem.start - 0.4, S.device.start + 0.2], [S.family.start - 1.2, S.future.end + 0.9]], papa: [[S.family.start - 1.2, S.future.end + 0.9]], tunde: [[S.family.start - 1.2, S.future.end + 0.9]], chioma: [[S.family.start - 1.2, S.future.end + 0.9]], mireille: [[langBeat.start - 0.6, S.future.end + 0.9]] };
const COLORS = { hearth: "#f0b86a", papa: "#9ad0ff", grandma: "#ffb3c1", tunde: "#9fe3a8", chioma: "#ffd166", mireille: "#d0b3ff" };
const STATE_COLOR = { idle: "#f0b86a", listening: "#52d6f5", thinking: "#a98bff", speaking: "#f0b86a" };
const SET = { problem: "kitchen", device: "kitchen", family: "kitchen", story: "kitchen", lang: "kitchen", montage: "kitchen", memory: "kitchen", future: "kitchen", options: "kitchen", inside: "inside", proof: "proof", end: "end" };
const DIP = new Set(["inside", "family", "options", "proof", "end"]);
const CAM = {
  problem: [{ x: 960, y: 560, s: 1.0 }, { x: 640, y: 620, s: 1.35 }],
  device: [{ x: 640, y: 620, s: 1.35 }, { x: 960, y: 560, s: 2.5 }],
  family: [{ x: 960, y: 590, s: 1.0 }, { x: 960, y: 600, s: 1.1 }],
  story: [{ x: 930, y: 600, s: 1.22 }, { x: 800, y: 610, s: 1.38 }],
  lang: [{ x: 1000, y: 600, s: 1.12 }, { x: 1140, y: 600, s: 1.2 }],
  montage: [{ x: 1140, y: 600, s: 1.2 }, { x: 1140, y: 600, s: 1.2 }],
  memory: [{ x: 960, y: 600, s: 1.2 }, { x: 1020, y: 600, s: 1.32 }],
  future: [{ x: 540, y: 600, s: 1.55 }, { x: 560, y: 620, s: 1.75 }],
  options: [{ x: 1250, y: 560, s: 1.3 }, { x: 1250, y: 560, s: 1.38 }],
};
const sceneAt = (t) => { let cur = "title"; for (const s of scenes) if (t >= s.start - 0.3) cur = s.k; return t < OPEN - 0.3 ? "title" : cur; };
const activeBeat = (t) => beats.find((b) => t >= b.start - 0.04 && t <= b.end + 0.14);
const amp = (b, t) => (b ? b.env[Math.min(b.env.length - 1, Math.max(0, Math.floor((t - b.start) * FPS)))] || 0 : 0);
const setT = (el, tr) => el.setAttribute("transform", tr);

function stateAt(t) {
  const b = activeBeat(t);
  if (b) return b.who === "hearth" ? { s: "speaking", l: amp(b, t), b } : b.who === "narrator" ? { s: "idle", l: 0.03, b } : { s: "listening", l: amp(b, t) * 0.85, b };
  const prev = [...beats].reverse().find((x) => x.end <= t), next = beats.find((x) => x.start > t);
  if (prev && next && prev.who !== "hearth" && prev.who !== "narrator" && next.who === "hearth" && t - prev.end < 2.5) return { s: "thinking", l: 0.22 };
  return { s: "idle", l: 0.04 };
}

// lower-third captions keyed to what Hearth says
const LOWERS = [
  [/^Okay, that sounds like/, "It recognises each person by voice"],
  [/Who's playing today/, "Family time: games made from your own stories"],
  [/kept it safe/, "Kept privately: the people, the places, the year"],
  [/^Bien sûr/, "It switches language by voice"],
  [/let me tell you the story/, "It finds the memory and retells it"],
  [/come after you/, "A message for children not yet born"],
].map(([re, text]) => { const b = beats.find((x) => x.who === "hearth" && re.test(x.text)); return b && { a: b.start - 0.1, z: b.end + 1.3, text }; }).filter(Boolean);

// ---------------------------------------------------------------- per-frame
const steam = $("steam");
let blinkPhase = { grandma: 0.3, papa: 1.1, tunde: 2.0, chioma: 2.7, mireille: 0.9 };

window.render = (t) => {
  window.VT = t * 1000;
  const sc = sceneAt(t), set = sc === "title" ? "title" : SET[sc], st = stateAt(t), b = st.b;
  const hearthTalking = st.s === "speaking", who = b && b.who;

  // ----- layers
  $("world").style.opacity = set === "kitchen" ? 1 : 0;
  $("insideSvg").style.opacity = set === "inside" ? 1 : 0;
  $("proof").style.opacity = set === "proof" ? 1 : 0;
  $("end").style.opacity = set === "end" ? 1 : 0;
  $("title").style.opacity = t < OPEN - 0.3 ? 1 : clamp(1 - (t - (OPEN - 0.3)) / 0.5);
  tvOrb.__vis = set === "kitchen"; phOrb.__vis = sc === "options"; bigOrb.__vis = t < OPEN; endOrb.__vis = set === "end";
  // dip to black at set changes
  let dip = 0; for (const s of scenes) if (DIP.has(s.k)) dip = Math.max(dip, 1 - Math.abs(t - (s.start - 0.3)) / 0.32);
  $("dip").style.opacity = clamp(dip);

  // ----- camera
  if (set === "kitchen") {
    const s = S[sc], k = CAM[sc] || CAM.family, p = ease((t - s.start) / Math.max(0.5, s.end - s.start));
    const x = lerp(k[0].x, k[1].x, p), y = lerp(k[0].y, k[1].y, p), z = lerp(k[0].s, k[1].s, p);
    const tx = clamp(960 - x * z, 1920 - 1920 * z, 0), ty = clamp(540 - y * z, 1080 - 1080 * z, 0); // never show beyond the edge of the set
    $("world").style.transform = `translate(${tx}px,${ty}px) scale(${z})`;
  }

  // ----- the device: LED ring + halo follow Hearth's state
  const col = STATE_COLOR[st.s], pulse = 0.55 + 0.45 * Math.min(1, st.l * 1.6 + 0.2 * Math.sin(t * 3));
  const ring = $("devRing"); ring.setAttribute("stroke", col); ring.setAttribute("opacity", st.s === "idle" ? 0.55 + 0.2 * Math.sin(t * 2) : 0.7 + 0.3 * pulse);
  $("devHalo").setAttribute("fill", col); $("devHalo").setAttribute("opacity", (st.s === "idle" ? 0.08 : 0.16 + 0.22 * st.l) * (sc === "device" ? 1.8 : 1));
  setT($("devWrap"), `translate(960 640) rotate(${sc === "device" ? 1.4 * Math.sin(t * 0.9) : 0})`);

  // ----- TV orb
  const convo = ["family", "story", "lang", "montage", "memory", "future"].includes(sc);
  tvOrb.awake = convo && (st.s !== "idle" || activeBeat(t - 1.2));
  tvOrb.set(st.s, st.s === "speaking" && b && /Right|right|wins|kept|Lovely/.test(b.text) ? "joy" : null); tvOrb.setLevel(st.l);
  $("tvLbl").textContent = { idle: "Sleeping", listening: "Listening", thinking: "Thinking", speaking: "Speaking" }[st.s];
  const frBeat = beats.find((x) => x.who === "hearth" && x.lang === "fr");
  $("tvLang").textContent = b && b.who === "hearth" && b.lang !== "en" ? b.name || { fr: "Français" }[b.lang] || "" : (frBeat && t > frBeat.start && sc === "lang" ? "Français" : "");
  if (sc === "story" || sc === "future") { const star = beats.find((x) => x.cue === "star"); if (star && t >= star.start + 0.3 && !window.__star) { tvOrb.setMemories(...Object.values(mk(withStory)).slice(0, 2)); tvOrb.highlight(TL.savedStory, 9000); window.__star = true; } }
  if (sc === "memory" && christmas && !window.__hl && b && b.who === "hearth") { tvOrb.highlight(christmas.id, 9000); window.__hl = true; }
  // the phone shows the same Hearth in a browser
  $("phone").style.display = sc === "options" ? "block" : "none";
  phOrb.set(sc === "options" ? "speaking" : "idle"); phOrb.setLevel(0.16 + 0.12 * Math.sin(t * 3.1) * Math.sin(t * 1.3));
  bigOrb.set("speaking"); bigOrb.setLevel(0.24 + 0.2 * Math.sin(t * 2) * Math.sin(t * 0.7 + 1));
  endOrb.set("idle"); endOrb.setLevel(0.07 + 0.04 * Math.sin(t * 2));

  // ----- steam + fan + sparkles
  let sh = ""; for (let i = 0; i < 7; i++) { const ph = (t * 0.45 + i / 7) % 1; sh += `<circle cx="${650 + Math.sin(ph * 6 + i) * 22}" cy="${520 - ph * 190}" r="${14 + ph * 34}" fill="#fff" opacity="${0.34 * (1 - ph) * Math.min(1, ph * 6)}"/>`; }
  steam.innerHTML = sh;
  setT($("fanBlades"), `rotate(${t * 520 % 360})`);
  let sp = ""; if (sc === "device") for (let i = 0; i < 9; i++) { const a = i * 0.7 + t * 0.4, r = 120 + (i % 3) * 36, tw = 0.5 + 0.5 * Math.sin(t * 3 + i * 2); sp += `<path d="M0 -10L3 -3L10 0L3 3L0 10L-3 3L-10 0L-3 -3Z" transform="translate(${960 + Math.cos(a) * r} ${540 + Math.sin(a) * r * 0.8}) scale(${0.6 + tw * 0.8})" fill="#ffe9b0" opacity="${0.2 + tw * 0.6}"/>`; }
  $("spark").innerHTML = sp;

  // ----- the forgotten-memories motif (problem scene)
  const nb = beats.filter((x) => x.scene === "problem"); let mc = "";
  if (sc === "problem" && nb[1]) {
    const cards = ["Christmas journey · 1987", "First market day · 1979", "The night the light went off · 1995"];
    cards.forEach((c, i) => {
      const t0 = nb[1].start + 0.1 + i * 1.0, a = clamp((t - t0) / 0.7), gone = nb[2] ? clamp((t - nb[2].start - 0.3) / 1.4) : 0;
      if (a > 0) mc += `<g transform="translate(${440 + i * 215} ${300 - gone * 90 + Math.sin(t * 1.3 + i) * 8 - (1 - ease(a)) * -30})" opacity="${a * (1 - gone)}" style="filter:blur(${gone * 8}px)"><rect width="200" height="96" rx="14" fill="#fdf7e8" stroke="#c9a77a" stroke-width="3"/><text x="100" y="42" font-size="19" text-anchor="middle" fill="#5b3a29" font-family="Georgia" font-weight="700">${c.split(" · ")[0]}</text><text x="100" y="72" font-size="22" text-anchor="middle" fill="#a8321f" font-family="Georgia">${c.split(" · ")[1]}</text></g>`;
    });
  }
  $("memCards").innerHTML = mc;

  // ----- people
  const wake = (id) => b && b.cue === "wake" && b.who === id;
  const cheerBeat = beats.find((x) => x.cue === "cheer" && t >= x.start && t <= x.start + 1.7);
  const groanBeat = beats.find((x) => x.cue === "groan" && t >= x.start && t <= x.start + 2.0);
  for (const id of Object.keys(POS)) {
    let a = 0, t0 = PRES[id][0][0]; for (const [i0, i1] of PRES[id]) { const v = clamp((t - i0) / 0.7) * clamp((i1 - t) / 0.6); if (v > a) { a = v; t0 = i0; } } const e = ease(clamp((t - t0) / 0.9));
    const g = $("p-" + id), talk = who === id, A_ = talk ? amp(b, t) : 0;
    const enter = id === "mireille" ? (1 - e) * 340 : 0, up = (1 - e) * 50;
    const bob = Math.sin(t * 1.5 + POS[id]) * 3 - A_ * 6;
    g.setAttribute("opacity", a);
    setT(g, `translate(${POS[id] + enter} ${700 + up + bob}) scale(${1.35 * (1 + (talk ? 0.025 * A_ : 0))})`);
    // mouth + eyes + head tilt
    const m = $(id + "-mouthShape"); m.setAttribute("d", `M-20 -1Q0 ${-3 - 4 * A_} 20 -1Q0 ${9 + 30 * A_} -20 -1Z`);
    const blink = ((t + blinkPhase[id]) % 3.7) < 0.13; setT($(id + "-eyes"), `translate(0 -70) scale(1 ${blink ? 0.1 : 1}) translate(0 70)`);
    const tilt = (groanBeat && id === "tunde") ? 8 : talk ? 2 * Math.sin(t * 5) : 1.2 * Math.sin(t * 0.8 + POS[id]);
    setT($(id + "-head"), `rotate(${tilt} 0 -20)`);
    setT($(id + "-brows"), `translate(0 ${talk ? -3 * A_ : 0})`);
    // arms
    const cheer = cheerBeat && ["papa", "tunde", "chioma"].includes(id), waving = wake(id);
    setT($(id + "-armR"), `rotate(${waving ? -150 + 14 * Math.sin(t * 14) : cheer ? -158 + 10 * Math.sin(t * 16) : 0} 104 70)`);
    setT($(id + "-armL"), `rotate(${cheer ? 158 - 10 * Math.sin(t * 16 + 1) : 0} -104 70)`);
  }

  // ----- inside view
  if (set === "inside") {
    const s = S.inside, q = ease((t - s.start - 0.3) / 2.2), cyc = ["#52d6f5", "#a98bff", "#f0b86a"][Math.floor((t - s.start) / 1.6) % 3];
    const y = (v0, v1) => lerp(v0, v1, q);
    setT($("pLED"), `translate(0 ${y(20, -300)})`); setT($("pMIC"), `translate(0 ${y(20, -170)})`); setT($("pPI"), `translate(0 20)`); setT($("pSPK"), `translate(0 ${y(20, 220)})`);
    $("shell").setAttribute("opacity", lerp(0.9, 0.55, q)); $("inRing").setAttribute("stroke", cyc);
    const ib = beats.filter((x) => x.scene === "inside"), b1 = ib[0];
    const at = { cSHELL: s.start + 1.0, cPI: b1.start + b1.dur * 0.16, cMIC: b1.start + b1.dur * 0.42, cSPK: b1.start + b1.dur * 0.66, cLED: b1.start + b1.dur * 0.86 };
    for (const [id, t0] of Object.entries(at)) $(id).setAttribute("opacity", clamp((t - t0) / 0.45));
    $("callouts").style.opacity = q > 0.6 ? 1 : 0;
  }

  // ----- scene chip, lower third, tools, subtitles
  const CHIP = { family: "Family time", story: "A story, kept", lang: "Any language", montage: "Seven languages", memory: "Months later", future: "For generations", options: "Device or browser", device: "Meet Hearth", problem: "" };
  $("chip").textContent = CHIP[sc] || ""; $("chip").style.opacity = CHIP[sc] ? 1 : 0;
  const low = LOWERS.find((x) => t >= x.a && t <= x.z);
  $("lower").textContent = low ? low.text : ""; $("lower").style.opacity = low ? clamp((t - low.a) / 0.35) * clamp((low.z - t) / 0.4) : 0;
  let th = ""; if (b && b.who === "hearth" && b.tools && b.tools.length) th = b.tools.slice(0, 3).map((c) => `<div class="tool"><b>tools/call · ${c.tool}</b><small>${c.args}</small></div>`).join("");
  if ($("tools").dataset.k !== th) { $("tools").innerHTML = th; $("tools").dataset.k = th; }

  // montage panel
  const mb = beats.find((x) => x.scene === "montage" && t >= x.start - 0.05 && t <= x.end + 0.2);
  $("montage").style.opacity = sc === "montage" && mb ? clamp((t - mb.start + 0.1) / 0.25) : 0;
  if (mb) { const isH = mb.who === "hearth"; $("mN").textContent = isH ? mb.name : "7 languages"; $("mG").textContent = isH ? mb.text : "English · Español · Français · 中文 · Português · Deutsch · हिन्दी"; $("mE").textContent = isH ? mb.sub || "" : "one family archive"; }

  // proof terminal
  if (set === "proof") {
    const s = S.proof, p = clamp((t - s.start) / Math.max(1, (s.end - s.start) * 0.85));
    const calls = TL.beats.flatMap((x) => x.tools || []).filter((c, i, a) => a.findIndex((d) => d.tool === c.tool) === i).slice(0, 9);
    const lines = [`<span class="a">$ npm test</span>`, `<span class="ok">✔ 9 passing</span>  <span class="m">accounts · 7-language scenes · MCP · family isolation</span>`, `<span class="a">$ python -m unittest device.test_device</span>`, `<span class="ok">✔ 13 passing</span>  <span class="m">wake phrase · offline queue · voice recognition</span>`, ``, `<span class="m"># real MCP tool calls recorded while making this film</span>`,
      ...calls.map((c) => `<span class="k">tools/call</span> ${c.tool} <span class="m">${String(c.args).slice(0, 74)}</span>`)];
    const total = lines.reduce((n, l) => n + l.replace(/<[^>]+>/g, "").length + 1, 0); let budget = Math.floor(total * p), out = [];
    for (const l of lines) { const plain = l.replace(/<[^>]+>/g, ""); if (budget <= 0) break; out.push(budget >= plain.length ? l : plain.slice(0, budget) + "▌"); budget -= plain.length + 1; }
    $("proofText").innerHTML = out.join("\n");
  }

  // subtitles with a progressive reveal
  let html = "";
  if (b && t >= b.start - 0.02 && t <= b.end + 0.35 && sc !== "montage" && set !== "end") {
    const k = clamp((t - b.start) / (b.dur * 0.88)), n = Math.ceil(b.text.length * k), shown = b.text.slice(0, n);
    const name = b.who === "narrator" ? "" : b.who === "hearth" ? "Hearth" : b.name || b.who;
    const colr = b.who === "narrator" ? "#e9dfcf" : COLORS[b.who] || "#fff";
    html = `<span class="pill">${name ? `<span class="nm" style="color:${colr}">${name}</span>` : ""}<span style="color:#fff;${b.who === "narrator" ? "font-style:italic;font-family:Georgia,serif" : ""}">${shown.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</span>${b.sub && k > 0.4 ? `<span class="tr">${b.sub}</span>` : ""}</span>`;
  }
  if ($("sub").dataset.k !== html) { $("sub").innerHTML = html; $("sub").dataset.k = html; }
  $("disc").style.opacity = set === "title" || set === "end" ? 0 : 0.8;

  window.flushRaf();
};

window.TOTAL = TL.total;
window.READY = true;
