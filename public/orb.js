// Hearth orb + memory constellation renderer (canvas 2D, no dependencies).
// States: idle | listening | thinking | speaking.  Level (0..1) drives the waveform ring.

const TAU = Math.PI * 2;
const HUES = { idle: 36, listening: 188, thinking: 268, speaking: 32, joy: 338 };
const TELLER_HUES = [36, 190, 330, 130, 270, 15];

export class Hearth {
  constructor(canvas) {
    this.c = canvas; this.x = canvas.getContext("2d");
    this.state = "idle"; this.mood = null; this.level = 0; this.target = 0; this.hue = 36;
    this.t = 0; this.spec = new Float32Array(96); this.getSpectrum = null;
    this.stars = []; this.links = []; this.active = new Map(); this.hover = null; this.rays = [];
    this.wake = 0; // 0 sleeping .. 1 awake
    this.awake = false;
    this.resize(); addEventListener("resize", () => this.resize());
    canvas.addEventListener("pointermove", (e) => this.pointer(e));
    canvas.addEventListener("pointerleave", () => { this.hover = null; });
    requestAnimationFrame((t) => this.frame(t));
  }

  resize() {
    const d = Math.min(devicePixelRatio || 1, 2), r = this.c.getBoundingClientRect();
    this.w = r.width; this.h = r.height; this.c.width = r.width * d; this.c.height = r.height * d; this.x.setTransform(d, 0, 0, d, 0, 0);
    this.layout();
  }

  get R() { return Math.min(this.w, this.h); }
  get cx() { return this.w / 2; }
  get cy() { return this.h * (this.w < 700 ? 0.42 : 0.5); }

  setMemories(mems, timeline) {
    const order = new Map(timeline.map((t, i) => [t.id, i]));
    const tellers = [...new Set(mems.map((m) => m.teller))];
    this.stars = mems.map((m) => ({ m, id: m.id, hue: TELLER_HUES[tellers.indexOf(m.teller) % TELLER_HUES.length], idx: order.get(m.id) ?? 0, born: performance.now(), tw: Math.random() * TAU }));
    this.stars.sort((a, b) => a.idx - b.idx);
    this.links = [];
    for (let i = 0; i < this.stars.length; i++) for (let j = i + 1; j < this.stars.length; j++) {
      const a = this.stars[i].m, b = this.stars[j].m;
      if (a.people.some((p) => b.people.includes(p)) || a.places.some((p) => b.places.includes(p))) this.links.push([this.stars[i], this.stars[j]]);
    }
    this.layout();
  }

  layout() {
    const n = this.stars.length || 1;
    this.stars.forEach((s, i) => {
      const ang = -Math.PI / 2 + (i / n) * TAU, ring = this.R * (0.34 + 0.07 * Math.sin(i * 2.3));
      s.ang = ang; s.r = ring;
    });
  }

  pos(s, t = this.t) {
    const drift = Math.sin(t * 0.0003 + s.tw) * 4;
    return [this.cx + Math.cos(s.ang) * (s.r + drift), this.cy + Math.sin(s.ang) * (s.r + drift) * 0.92];
  }

  pointer(e) {
    const r = this.c.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
    this.hover = null;
    for (const s of this.stars) { const [x, y] = this.pos(s); if (Math.hypot(mx - x, my - y) < 14) this.hover = s; }
  }

  highlight(id, ms = 7000) { this.active.set(id, performance.now() + ms); const s = this.stars.find((q) => q.id === id); if (s) this.rays.push({ s, t0: performance.now() }); }
  addStar(m, timeline) { return m; }

  nod() { this.nodAt = performance.now(); }

  set(state, mood = null) { this.state = state; this.mood = mood; }
  setLevel(v) { this.target = Math.max(0, Math.min(1, v)); }

  frame(now) {
    const dt = Math.min(50, now - (this.t || now)); this.t = now;
    const x = this.x, { cx, cy, R } = this;
    this.level += (this.target - this.level) * 0.22;
    const th = this.mood === "joy" ? HUES.joy : HUES[this.state] ?? 36;
    let dh = ((th - this.hue + 540) % 360) - 180; this.hue = (this.hue + dh * 0.06 + 360) % 360;
    this.wake += ((this.awake ? 1 : 0) - this.wake) * 0.05;
    const nk = Math.max(0, 1 - (now - (this.nodAt || -1e9)) / 650);
    const H = this.hue, L = this.level, base = R * (0.115 + 0.012 * this.wake) * (1 + 0.09 * Math.sin(nk * Math.PI));
    x.clearRect(0, 0, this.w, this.h);
    this.drawConstellation(now, H);

    // outer glow
    const glow = base * (3.2 + L * 1.6 + this.wake * 0.6);
    let g = x.createRadialGradient(cx, cy, base * 0.4, cx, cy, glow);
    g.addColorStop(0, `hsla(${H},90%,60%,${0.30 + L * 0.3 + this.wake * 0.1})`); g.addColorStop(1, `hsla(${H},90%,50%,0)`);
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, glow, 0, TAU); x.fill();

    // HUD ticks
    x.save(); x.translate(cx, cy);
    const rot = now * 0.00008 * (this.state === "thinking" ? 14 : 1);
    x.rotate(rot); x.strokeStyle = `hsla(${H},80%,70%,${0.18 + this.wake * 0.2})`; x.lineWidth = 1;
    const tr = base * 2.65;
    for (let i = 0; i < 120; i++) { const a = (i / 120) * TAU, l = i % 10 === 0 ? 11 : 4; x.beginPath(); x.moveTo(Math.cos(a) * tr, Math.sin(a) * tr); x.lineTo(Math.cos(a) * (tr + l), Math.sin(a) * (tr + l)); x.stroke(); }
    x.rotate(-rot * 2.4); x.lineWidth = 2; x.strokeStyle = `hsla(${H},90%,65%,${0.35 + this.wake * 0.3})`;
    for (let k = 0; k < 3; k++) { x.beginPath(); const a0 = k * 2.09 + now * 0.0004 * (this.state === "thinking" ? 5 : 1); x.arc(0, 0, base * 2.2, a0, a0 + 0.9 + (this.state === "thinking" ? 0.5 : 0)); x.stroke(); }
    x.restore();

    // waveform ring
    const N = 96, wr = base * 1.55;
    this.sampleSpectrum(now);
    x.save(); x.translate(cx, cy); x.lineCap = "round"; x.lineWidth = Math.max(2, R * 0.004);
    for (let i = 0; i < N; i++) {
      const a = (i / N) * TAU - Math.PI / 2, v = this.spec[i], len = base * (0.08 + v * 0.95);
      x.strokeStyle = `hsla(${H + v * 30},95%,${58 + v * 20}%,${0.4 + v * 0.6})`;
      x.beginPath(); x.moveTo(Math.cos(a) * wr, Math.sin(a) * wr); x.lineTo(Math.cos(a) * (wr + len), Math.sin(a) * (wr + len)); x.stroke();
    }
    x.restore();

    // liquid core
    x.save(); x.translate(cx, cy);
    for (let layer = 0; layer < 3; layer++) {
      x.beginPath();
      const amp = base * (0.05 + L * 0.22) * (1 - layer * 0.25), sp = now * 0.0007 * (layer + 1) * (this.state === "thinking" ? 2.4 : 1);
      for (let i = 0; i <= 120; i++) {
        const a = (i / 120) * TAU, rr = base * (1 - layer * 0.1) + Math.sin(a * 3 + sp) * amp + Math.sin(a * 5 - sp * 1.3) * amp * 0.6 + Math.sin(a * 2 + sp * 0.7) * amp * 0.5;
        i ? x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : x.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      x.closePath();
      const cg = x.createRadialGradient(-base * 0.3, -base * 0.35, base * 0.1, 0, 0, base * 1.2);
      cg.addColorStop(0, `hsla(${H + 20},100%,${88 - layer * 12}%,${0.95 - layer * 0.25})`); cg.addColorStop(0.55, `hsla(${H},90%,${58 - layer * 6}%,${0.8 - layer * 0.2})`); cg.addColorStop(1, `hsla(${H - 20},90%,32%,${0.7 - layer * 0.2})`);
      x.fillStyle = cg; x.fill();
    }
    x.restore();

    // orbiting particles
    const P = 46;
    for (let i = 0; i < P; i++) {
      const sp = (i % 5 + 1) * 0.00007 * (this.state === "thinking" ? 6 : 1), a = (i / P) * TAU + now * sp * (i % 2 ? 1 : -1), rr = base * (1.9 + (i % 7) * 0.12 + L * 0.3);
      x.fillStyle = `hsla(${H + (i % 9) * 4},90%,75%,${0.25 + (i % 4) * 0.12})`; x.beginPath(); x.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 1 + (i % 3) * 0.7, 0, TAU); x.fill();
    }
    requestAnimationFrame((t) => this.frame(t));
  }

  sampleSpectrum(now) {
    const N = this.spec.length, L = this.level;
    if (this.state === "listening" && this.getSpectrum) {
      const f = this.getSpectrum(); // Uint8Array
      for (let i = 0; i < N; i++) { const j = Math.floor(Math.pow(i / N, 1.6) * f.length * 0.5); this.spec[i] += ((f[j] / 255) * 1.2 - this.spec[i]) * 0.4; }
    } else {
      for (let i = 0; i < N; i++) {
        const idle = 0.04 + 0.03 * Math.sin(now * 0.002 + i * 0.7);
        const voiced = this.state === "speaking" ? L * (0.5 + 0.5 * Math.sin(now * 0.012 + i * 0.9)) * (0.6 + 0.4 * Math.sin(i * 0.37 + now * 0.004)) : 0;
        const think = this.state === "thinking" ? 0.12 * (0.5 + 0.5 * Math.sin(now * 0.006 - i * 0.4)) : 0;
        this.spec[i] += (Math.abs(idle + voiced + think) - this.spec[i]) * 0.3;
      }
    }
  }

  drawConstellation(now, H) {
    const x = this.x, nowMs = performance.now();
    x.save();
    x.strokeStyle = `hsla(${H},60%,70%,0.07)`; x.lineWidth = 1; x.setLineDash([2, 7]);
    x.beginPath(); x.ellipse(this.cx, this.cy, this.R * 0.34, this.R * 0.34 * 0.92, 0, 0, TAU); x.stroke(); x.setLineDash([]);
    for (const [a, b] of this.links) {
      const [x1, y1] = this.pos(a), [x2, y2] = this.pos(b), hot = this.active.has(a.id) && this.active.get(a.id) > nowMs || this.active.has(b.id) && this.active.get(b.id) > nowMs;
      x.strokeStyle = `hsla(${a.hue},70%,70%,${hot ? 0.45 : 0.1})`; x.beginPath(); x.moveTo(x1, y1);
      x.quadraticCurveTo(this.cx + (x1 + x2 - 2 * this.cx) * 0.25, this.cy + (y1 + y2 - 2 * this.cy) * 0.25, x2, y2); x.stroke();
    }
    for (const s of this.stars) {
      const [px, py] = this.pos(s), on = (this.active.get(s.id) || 0) > nowMs, hov = this.hover === s;
      const age = Math.min(1, (nowMs - s.born) / 900), tw = 0.6 + 0.4 * Math.sin(now * 0.002 + s.tw);
      const r = Math.max(0.4, (on ? 6.5 : hov ? 5.5 : 3.2) * age + (on ? Math.sin(now * 0.01) * 1.2 : 0));
      const g = x.createRadialGradient(px, py, 0, px, py, r * 5); g.addColorStop(0, `hsla(${s.hue},95%,75%,${(on ? 0.9 : 0.45) * tw})`); g.addColorStop(1, `hsla(${s.hue},95%,60%,0)`);
      x.fillStyle = g; x.beginPath(); x.arc(px, py, r * 5, 0, TAU); x.fill();
      x.fillStyle = `hsl(${s.hue},95%,${on ? 92 : 80}%)`; x.beginPath(); x.arc(px, py, r, 0, TAU); x.fill();
      if (on || hov) {
        x.font = "500 13px system-ui, sans-serif"; x.textAlign = px > this.cx ? "left" : "right"; x.fillStyle = "rgba(255,255,255,.92)";
        const dx = px > this.cx ? 14 : -14; x.fillText(s.m.title, px + dx, py + 4);
        x.font = "11px system-ui, sans-serif"; x.fillStyle = `hsla(${s.hue},80%,75%,.9)`; x.fillText(`${s.m.teller}${s.m.dates[0] ? " · " + s.m.dates[0] : ""}`, px + dx, py + 19);
      }
    }
    this.rays = this.rays.filter((r) => nowMs - r.t0 < 1400);
    for (const r of this.rays) {
      const k = (nowMs - r.t0) / 1400, [px, py] = this.pos(r.s);
      x.strokeStyle = `hsla(${r.s.hue},95%,75%,${(1 - k) * 0.8})`; x.lineWidth = 2; x.beginPath(); x.moveTo(px, py);
      x.lineTo(px + (this.cx - px) * Math.min(1, k * 1.6), py + (this.cy - py) * Math.min(1, k * 1.6)); x.stroke();
    }
    x.restore();
  }
}
