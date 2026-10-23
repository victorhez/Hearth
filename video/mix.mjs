// Stage 3: original music bed + sound effects (synthesized here, no samples, nothing copyrighted), mix with the voices
// (music ducks under speech), and encode the final MP4 from the rendered frames.
//   node video/mix.mjs [--frames frames] [--no-video]
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url)), OUT = path.join(here, "out");
const args = process.argv.slice(2), arg = (k, d) => { const i = args.indexOf("--" + k); return i < 0 ? d : args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true; };
const TL = JSON.parse(fs.readFileSync(path.join(OUT, "timeline.json"), "utf8"));
const SR = 44100, DUR = TL.total + 1.0, N = Math.ceil(DUR * SR);

function wav(file, L, R) {
  const buf = Buffer.alloc(44 + N * 4);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVEfmt ", 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
  for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(L[i] * 32767))), 44 + i * 4); buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(R[i] * 32767))), 46 + i * 4); }
  fs.writeFileSync(file, buf);
}
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

// ---------------- music: warm A-minor pad, kalimba-style plucks, soft bass and shaker (96 bpm)
function music() {
  const L = new Float32Array(N), R = new Float32Array(N), beat = 60 / 96, bar = beat * 4;
  const chords = [[45, 48, 52, 55], [41, 45, 48, 52], [48, 52, 55, 59], [43, 47, 50, 55]]; // Am7 Fmaj7 Cmaj7 G
  const penta = [69, 72, 74, 76, 79, 81, 76, 74], pat = [0, 2, 4, 2, 5, 4, 3, 1, 2, 4, 6, 4, 3, 2, 1, 0];
  let seed = 7; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const add = (t0, dur, fn) => { const a = Math.floor(t0 * SR), b = Math.min(N, Math.floor((t0 + dur) * SR)); for (let i = Math.max(0, a); i < b; i++) fn(i, (i - a) / SR); };
  for (let c = 0; c * bar * 2 < DUR; c++) {
    const t0 = c * bar * 2, chord = chords[c % 4], len = bar * 2;
    for (const [k, m] of chord.entries()) { const f = hz(m), pan = (k - 1.5) * 0.18;
      add(t0, len + 0.8, (i, t) => { const env = Math.min(1, t / 0.9) * Math.min(1, (len + 0.8 - t) / 0.9), v = (Math.sin(2 * Math.PI * f * t + 0.4 * Math.sin(t * 4.3 + k)) + 0.3 * Math.sin(2 * Math.PI * f * 2 * t)) * 0.055 * env; L[i] += v * (1 - pan); R[i] += v * (1 + pan); }); }
    const root = hz(chord[0] - 12); // bass on beats 1 and 3
    for (const b of [0, 2]) add(t0 + b * beat, 0.9, (i, t) => { const v = Math.sin(2 * Math.PI * root * t) * 0.16 * Math.exp(-t * 3.2); L[i] += v; R[i] += v; });
    for (let s = 0; s < 16; s++) { // plucks on 8th notes with rests
      if (rnd() < 0.28) continue; const m = penta[pat[(c * 16 + s) % 16]], f = hz(m + (rnd() < 0.12 ? 12 : 0)), tt = t0 + s * beat / 2, pan = (rnd() - 0.5) * 0.7;
      add(tt, 1.3, (i, t) => { const v = (Math.sin(2 * Math.PI * f * t) + 0.45 * Math.sin(2 * Math.PI * f * 3.9 * t) * Math.exp(-t * 14)) * 0.09 * Math.exp(-t * 3.4); L[i] += v * (1 - pan); R[i] += v * (1 + pan); }); }
    for (let s = 0; s < 8; s++) { const tt = t0 + s * beat + beat / 2; let lp = 0; add(tt, 0.12, (i, t) => { const n = (rnd() * 2 - 1); lp += (n - lp) * 0.5; const v = (n - lp) * 0.02 * Math.exp(-t * 30); L[i] += v; R[i] += v * 0.8; }); }
  }
  const fade = (i) => Math.min(1, i / (SR * 1.5)) * Math.min(1, (N - i) / (SR * 2.2));
  for (let i = 0; i < N; i++) { const f = fade(i) * 0.7; L[i] *= f; R[i] *= f; }
  return [L, R];
}

// ---------------- sound effects
function sfx() {
  const L = new Float32Array(N), R = new Float32Array(N);
  const tone = (t0, f, dur, g, dec) => { const a = Math.floor(t0 * SR); for (let i = 0; i < dur * SR && a + i < N; i++) { const t = i / SR, v = Math.sin(2 * Math.PI * f * t) * g * Math.min(1, t / 0.01) * Math.exp(-t * dec); L[a + i] += v; R[a + i] += v; } };
  for (const e of TL.sfx) {
    if (e.kind === "wake") { tone(e.t, 660, 0.4, 0.16, 7); tone(e.t + 0.09, 990, 0.45, 0.16, 7); }
    if (e.kind === "ding") { tone(e.t, 1175, 0.5, 0.14, 8); tone(e.t, 1760, 0.5, 0.05, 10); }
    if (e.kind === "star") { [1319, 1760, 2093, 2637].forEach((f, k) => tone(e.t + k * 0.07, f, 0.9, 0.09, 4)); }
  }
  return [L, R];
}

const [mL, mR] = music(), [sL, sR] = sfx();
wav(path.join(OUT, "music.wav"), mL, mR); wav(path.join(OUT, "sfx.wav"), sL, sR);
console.log("music + sfx written");

// ---------------- mix with ffmpeg: voices -> bus; music ducked by the voice bus; + sfx
const GAIN = { narrator: 1.0, hearth: 1.0, papa: 0.95, grandma: 0.98, tunde: 0.95, chioma: 0.95, mireille: 0.95 };
const ins = [], filt = [];
TL.beats.forEach((b, i) => { ins.push("-i", path.join(OUT, b.file)); const ms = Math.round(b.start * 1000); filt.push(`[${i}:a]aresample=44100,aformat=channel_layouts=stereo,adelay=${ms}|${ms},volume=${GAIN[b.who] ?? 1}[v${i}]`); });
const nV = TL.beats.length; ins.push("-i", path.join(OUT, "music.wav"), "-i", path.join(OUT, "sfx.wav"));
filt.push(`${TL.beats.map((_, i) => `[v${i}]`).join("")}amix=inputs=${nV}:normalize=0:duration=longest,volume=1.0,asplit=2[vo1][vo2]`);
filt.push(`[${nV}:a]volume=0.85[mus]`);
filt.push(`[mus][vo1]sidechaincompress=threshold=0.02:ratio=10:attack=15:release=500:makeup=1[duck]`);
filt.push(`[duck][vo2][${nV + 1}:a]amix=inputs=3:normalize=0:duration=longest,alimiter=limit=0.95,loudnorm=I=-16:TP=-1.5:LRA=9[aout]`);
const script = path.join(OUT, "mix.filter"); fs.writeFileSync(script, filt.join(";\n"));
const wavOut = path.join(OUT, "mix.m4a");
let r = spawnSync("ffmpeg", ["-y", "-v", "error", ...ins, "-/filter_complex", script, "-map", "[aout]", "-t", String(TL.total), "-c:a", "aac", "-b:a", "192k", wavOut], { stdio: "inherit" });
if (r.status !== 0) { console.error("audio mix failed"); process.exit(1); }
console.log("audio mixed:", wavOut);

if (!arg("no-video", false)) {
  const frames = path.join(OUT, String(arg("frames", "frames")));
  const mp4 = path.join(OUT, "hearth-demo.mp4");
  r = spawnSync("ffmpeg", ["-y", "-v", "error", "-stats", "-framerate", String(TL.fps), "-i", path.join(frames, "f%06d.jpg"), "-i", wavOut,
    "-vf", `fade=t=in:st=0:d=0.6,fade=t=out:st=${(TL.total - 0.9).toFixed(2)}:d=0.9,format=yuv420p`, "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-movflags", "+faststart", "-c:a", "copy", "-shortest", mp4], { stdio: "inherit" });
  if (r.status !== 0) { console.error("encode failed"); process.exit(1); }
  console.log("DONE:", mp4);
}
