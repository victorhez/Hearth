// Neural text-to-speech. Provider order (first that works wins):
//   polly  Amazon Polly neural/generative voices, used when AWS credentials are present (LEGACYLINK_TTS=polly forces it)
//   edge   Microsoft neural voices via msedge-tts: free, no key, unofficial (LEGACYLINK_TTS=edge forces it)
// Returns { mp3: Buffer, provider } or null so the browser can fall back to its own voice.
import crypto from "node:crypto";

import { LANGS } from "./i18n.mjs";

const cache = new Map();

async function polly(text, v) {
  const { PollyClient, SynthesizeSpeechCommand } = await import("@aws-sdk/client-polly");
  const c = new PollyClient({ region: process.env.AWS_REGION || "us-east-1" });
  const r = await c.send(new SynthesizeSpeechCommand({ Text: text, VoiceId: v, Engine: process.env.POLLY_ENGINE || "neural", OutputFormat: "mp3", TextType: "text" }));
  return Buffer.from(await r.AudioStream.transformToByteArray());
}

async function edge(text, v) {
  const { MsEdgeTTS, OUTPUT_FORMAT } = await import("msedge-tts");
  const tts = new MsEdgeTTS();
  await tts.setMetadata(v, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const { audioStream } = tts.toStream(text, { rate: -0.04 });
  const chunks = [];
  await new Promise((res, rej) => { audioStream.on("data", (d) => chunks.push(d)); audioStream.on("end", res); audioStream.on("error", rej); setTimeout(() => rej(new Error("tts timeout")), 12000); });
  try { tts.close(); } catch {}
  return Buffer.concat(chunks);
}

const wantsPolly = () => process.env.LEGACYLINK_TTS === "polly" || (!process.env.LEGACYLINK_TTS && (process.env.AWS_ACCESS_KEY_ID || process.env.AWS_PROFILE || process.env.BEDROCK_MODEL_ID));

export async function synthesize(text, who = "hearth", lang = "en") {
  text = String(text).slice(0, 1500).trim(); if (!text) return null;
  const L = LANGS[lang] || LANGS.en, over = process.env["LEGACYLINK_VOICE_" + lang.toUpperCase()], role = L.edge[who] ? who : "hearth", key = crypto.createHash("sha1").update(lang + role + (over || "") + text).digest("hex");
  if (cache.has(key)) return cache.get(key);
  const order = process.env.LEGACYLINK_TTS === "edge" ? ["edge"] : wantsPolly() ? ["polly", "edge"] : ["edge"];
  for (const p of order) {
    try { const mp3 = await (p === "polly" ? polly : edge)(text, p === "polly" ? L.polly[role] : (role === "hearth" && over) || L.edge[role]); if (mp3.length > 500) { const out = { mp3, provider: p }; cache.set(key, out); if (cache.size > 200) cache.delete(cache.keys().next().value); return out; } }
    catch (e) { console.error(`[tts ${p}]`, e.message); }
  }
  return null;
}
