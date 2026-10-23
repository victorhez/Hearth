// Voice engine: always-on listening, wake word, live level, and speech output. No typing required.
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const WAKE = /^\s*(?:(?:hey|hi|ok|okay|hello|hola|oye|salut|bonjour|ol[aá]|hallo|嘿|嗨|你好|नमस्ते|हे)[\s,，]*)?(?:hearth|heart|earth|hurt|hard|hearts|alexa|harth|壁炉|赫斯|哈斯|हर्थ|हार्थ)[\s,，.!?。]*/i;

export class Voice extends EventTarget {
  constructor() {
    super();
    this.supported = !!SR; this.listening = false; this.muted = false; this.speaking = false;
    this.ctx = null; this.analyser = null; this.freq = null; this.rec = null; this.alive = false;
    this.voice = null; this.lang = "en-US";
    if ("speechSynthesis" in window) { const pick = () => { const v = speechSynthesis.getVoices(); this.voice = v.find((x) => /Natural|Aria|Jenny|Samantha|Google UK English Female|Google US English/i.test(x.name) && /en/i.test(x.lang)) || v.find((x) => /^en/i.test(x.lang)) || null; }; pick(); speechSynthesis.onvoiceschanged = pick; }
  }

  async start() {
    if (this.alive) return;
    this.alive = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      const src = this.ctx.createMediaStreamSource(stream); this.analyser = this.ctx.createAnalyser(); this.analyser.fftSize = 512; this.analyser.smoothingTimeConstant = 0.7;
      src.connect(this.analyser); this.freq = new Uint8Array(this.analyser.frequencyBinCount);
    } catch (e) { this.dispatchEvent(new CustomEvent("error", { detail: "Microphone blocked. Allow mic access and reload." })); }
    this.listen();
  }

  spectrum() { if (this.analyser) this.analyser.getByteFrequencyData(this.freq); return this.freq || new Uint8Array(64); }
  level() { if (!this.analyser) return 0; const f = this.spectrum(); let s = 0; for (let i = 2; i < 40; i++) s += f[i]; return Math.min(1, (s / 38 / 255) * 2.4); }

  listen() {
    if (!SR || !this.alive || this.rec) return;
    const rec = (this.rec = new SR());
    rec.continuous = true; rec.interimResults = true; rec.lang = this.lang;
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i], text = r[0].transcript.trim();
        if (!text || this.speaking) continue;
        this.dispatchEvent(new CustomEvent(r.isFinal ? "final" : "interim", { detail: text }));
      }
    };
    rec.onerror = (e) => { if (e.error === "not-allowed" || e.error === "service-not-allowed") this.dispatchEvent(new CustomEvent("error", { detail: "Microphone blocked. Allow mic access and reload." })); };
    rec.onend = () => { this.rec = null; if (this.alive && !this.speaking) setTimeout(() => this.listen(), 150); };
    try { rec.start(); this.listening = true; } catch { this.rec = null; }
  }

  restartRec() { this.pauseRec(); if (this.alive && !this.speaking) setTimeout(() => this.listen(), 200); }

  pauseRec() { try { this.rec?.abort(); } catch {} this.rec = null; }

  // Neural voice from the server (/api/tts), chunked by sentence so the first words start fast.
  // Audio is routed through an analyser so the orb moves with the real voice. Falls back to the browser voice.
  async speak(text, who = "hearth", opts = {}) {
    this.speaking = true; this.pauseRec(); this.stopSpeaking();
    const chunks = text.match(/[^.!?]+[.!?]*\s*/g) || [text];
    const offs = []; let o = 0; for (const c of chunks) { offs.push(o); o += c.length; }
    const url = (t) => `/api/tts?who=${who}&text=${encodeURIComponent(t.trim())}${opts.token ? "&token=" + opts.token : ""}&lang=${opts.lang || "en"}`;
    const fetches = chunks.map((c) => fetch(url(c)).then((r) => (r.status === 200 ? r.blob() : null)).catch(() => null));
    this.cancel = false;
    try {
      if (!this.out) { this.out = new (window.AudioContext || window.webkitAudioContext)(); this.outAn = this.out.createAnalyser(); this.outAn.fftSize = 256; this.outAn.connect(this.out.destination); this.outBuf = new Uint8Array(this.outAn.frequencyBinCount); }
      await this.out.resume();
      for (let i = 0; i < chunks.length && !this.cancel; i++) {
        const blob = await fetches[i];
        if (!blob) { await this.browserSpeak(chunks.slice(i).join("")); break; }
        await this.playBlob(blob, offs[i], chunks[i].length);
      }
    } catch { await this.browserSpeak(text); }
    this.speaking = false; this.dispatchEvent(new Event("speakend")); setTimeout(() => this.listen(), 250);
  }

  playBlob(blob, off, len) {
    return new Promise((resolve) => {
      const a = (this.cur = new Audio(URL.createObjectURL(blob)));
      const src = this.out.createMediaElementSource(a); src.connect(this.outAn);
      a.ontimeupdate = () => { if (a.duration) this.dispatchEvent(new CustomEvent("word", { detail: Math.floor(off + (a.currentTime / a.duration) * len) })); };
      a.onended = a.onerror = () => { URL.revokeObjectURL(a.src); resolve(); };
      a.play().catch(resolve);
    });
  }

  outLevel() { if (!this.outAn || !this.speaking) return 0; this.outAn.getByteFrequencyData(this.outBuf); let s = 0; for (let i = 1; i < 40; i++) s += this.outBuf[i]; return Math.min(1, (s / 39 / 255) * 2.2); }

  browserSpeak(text) {
    return new Promise((resolve) => {
      if (!("speechSynthesis" in window)) return resolve();
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text); u.lang = this.lang; if (this.voice && this.voice.lang.startsWith(this.lang.slice(0, 2))) u.voice = this.voice; u.rate = 0.96;
      u.onboundary = (e) => this.dispatchEvent(new CustomEvent("word", { detail: e.charIndex }));
      u.onend = u.onerror = () => resolve(); speechSynthesis.speak(u);
    });
  }

  stopSpeaking() { this.cancel = true; try { this.cur?.pause(); this.cur?.dispatchEvent(new Event("ended")); } catch {} if ("speechSynthesis" in window) speechSynthesis.cancel(); }
  static stripWake(t) { const m = t.match(WAKE); return m ? { woke: true, rest: t.slice(m.index + m[0].length).trim() } : { woke: false, rest: t }; }
}
