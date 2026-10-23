// Generates 16 kHz mono WAV test voices (several distinct neural voices x several sentences) for the speaker-recognition tests.
// usage: node device/tools/make_test_voices.mjs <outDir>
import fs from "node:fs";
import path from "node:path";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { MPEGDecoder } from "mpg123-decoder";

const out = process.argv[2];
fs.mkdirSync(out, { recursive: true });
const VOICES = { abeo: "en-NG-AbeoNeural", ezinne: "en-NG-EzinneNeural", guy: "en-US-GuyNeural", jenny: "en-US-JennyNeural" };
const SENTENCES = [
  "Hey Hearth, I want to tell you a story about the first time we went to the village for Christmas.",
  "Please remember that my grandmother used to cook jollof rice every Sunday after church.",
  "It was a long time ago, and I still remember how the whole family sat together in the parlor.",
  "What did my father say about his first job? I would like to hear it again tonight.",
];

async function synth(voice, text) {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const { audioStream } = tts.toStream(text);
  const chunks = [];
  await new Promise((res, rej) => { audioStream.on("data", (d) => chunks.push(d)); audioStream.on("end", res); audioStream.on("error", rej); setTimeout(() => rej(new Error("timeout")), 20000); });
  try { tts.close(); } catch {}
  return Buffer.concat(chunks);
}

function wav16k(pcm24k, rate) {
  const ratio = rate / 16000, n = Math.floor(pcm24k.length / ratio), o = Buffer.alloc(44 + n * 2);
  for (let i = 0; i < n; i++) {
    const p = i * ratio, a = Math.floor(p), f = p - a, s = (pcm24k[a] || 0) * (1 - f) + (pcm24k[a + 1] || 0) * f;
    o.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(s * 32767))), 44 + i * 2);
  }
  o.write("RIFF", 0); o.writeUInt32LE(36 + n * 2, 4); o.write("WAVEfmt ", 8); o.writeUInt32LE(16, 16); o.writeUInt16LE(1, 20); o.writeUInt16LE(1, 22);
  o.writeUInt32LE(16000, 24); o.writeUInt32LE(32000, 28); o.writeUInt16LE(2, 32); o.writeUInt16LE(16, 34); o.write("data", 36); o.writeUInt32LE(n * 2, 40);
  return o;
}

const dec = new MPEGDecoder();
await dec.ready;
for (const [name, voice] of Object.entries(VOICES)) {
  for (let i = 0; i < SENTENCES.length; i++) {
    const mp3 = await synth(voice, SENTENCES[i]);
    const r = dec.decode(new Uint8Array(mp3));
    fs.writeFileSync(path.join(out, `${name}_${i}.wav`), wav16k(r.channelData[0], r.sampleRate));
    dec.reset();
  }
}
console.log("wrote", Object.keys(VOICES).length * SENTENCES.length, "files to", out);
