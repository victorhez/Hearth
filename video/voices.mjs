// Neural voice synthesis for the film, with per-character pitch/rate so a few Nigerian English voices play a whole family.
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

export const CAST = {
  narrator: { voice: "en-NG-AbeoNeural", rate: "+8%", pitch: "+0%" },
  hearth:   { voice: "en-NG-EzinneNeural", rate: "+5%", pitch: "+0%" },
  papa:     { voice: "en-NG-AbeoNeural", rate: "+4%", pitch: "-14%" },
  grandma:  { voice: "en-NG-EzinneNeural", rate: "-4%", pitch: "-16%" },
  tunde:    { voice: "en-NG-AbeoNeural", rate: "+8%", pitch: "+38%" },
  chioma:   { voice: "en-NG-EzinneNeural", rate: "+8%", pitch: "+30%" },
  mireille: { voice: "fr-FR-DeniseNeural", rate: "+0%", pitch: "+0%" },
};

export async function synth(text, spec, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const tts = new MsEdgeTTS();
      await tts.setMetadata(spec.voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
      const { audioStream } = tts.toStream(text, { rate: spec.rate, pitch: spec.pitch });
      const chunks = [];
      await new Promise((res, rej) => { audioStream.on("data", (d) => chunks.push(d)); audioStream.on("end", res); audioStream.on("error", rej); setTimeout(() => rej(new Error("tts timeout")), 25000); });
      try { tts.close(); } catch {}
      const b = Buffer.concat(chunks);
      if (b.length > 800) return b;
    } catch (e) { if (i === retries) throw e; }
  }
  throw new Error("empty audio for: " + text);
}
