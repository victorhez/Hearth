// The film's story. Everything Hearth says is REAL output from the project's server, recorded here by actually
// having the conversations below. Characters' lines are the scripted human side.
import { CAST } from "./voices.mjs";
import { LANGS } from "../src/i18n.mjs";

const J = { "content-type": "application/json" };

export async function recordConversation(base) {
  const say = async (session, utterance, o = {}) => {
    const r = await fetch(base + "/api/say", { method: "POST", headers: { ...J, "x-household": "home" }, body: JSON.stringify({ session, utterance, teller: o.teller || "Guest", lang: o.lang || "en", speaker: o.speaker }) }).then((x) => x.json());
    return { reply: r.reply, lang: r.lang, mode: r.mode, calls: r.calls || [], saved: r.saved, story: r.story, teller: r.teller };
  };
  const out = {};
  // 1. the family recognises each other by voice, then plays "family time"
  out.a1 = await say("fam", "", { speaker: { name: "Emeka", score: 0.84 } });
  out.a2 = await say("fam", "yes");
  out.a3 = await say("fam", "Hey Hearth, let's have family time");
  out.a4 = await say("fam", "Emeka, Tunde and Chioma");
  const qs = out.a4.calls.find((c) => c.tool === "generate_quiz").result.questions;
  out.qs = qs;
  out.a5 = await say("fam", qs[0].answer);                                           // Papa answers correctly
  out.a6 = await say("fam", qs[1].choices.find((c) => c !== qs[1].answer));          // Tunde gets one wrong -> scoreboard
  // 2. grandma tells a story
  const G = { teller: "Mama Kemi" };
  out.b1 = await say("gran", "Hey Hearth, I want to tell you a story.", G);
  out.b2 = await say("gran", "It was 1990, in Kano, when your grandfather and I opened our first provision shop. I was so proud.", G);
  out.b3 = await say("gran", "He sold the first tin of tomato that morning, and that night we danced inside the shop. I was so happy.", G);
  out.b4 = await say("gran", "That's all.", G);
  // 3. a cousin who speaks French
  const M = { teller: "Mireille" };
  out.c1 = await say("fr", "Hey Hearth, parle français", M);
  out.c2 = await say("fr", "Je veux vous raconter une histoire", { ...M, lang: "fr" });
  out.c3 = await say("fr", "C'était en 2008, à Douala, avec ma soeur Aïcha. J'étais très heureuse.", { ...M, lang: "fr" });
  // 4. other languages: Hearth's greeting in each (from the project's own string tables)
  out.langs = {};
  for (const l of ["zh", "es", "pt", "de", "hi"]) out.langs[l] = (await fetch(base + "/api/i18n?lang=" + l).then((x) => x.json())).hello;
  // 5. days later: a child asks; grandma leaves a message for the future
  out.e1 = await say("kid", "Hey Hearth, what did Mama Kemi say about the Christmas in the village?", { teller: "Tunde" });
  out.e2 = await say("msg", "Hey Hearth, I want to leave a message for my grandchildren.", G);
  out.e3 = await say("msg", "Be kind, work hard, and always call your mother.", G);
  out.e4 = await say("msg", "That's all.", G);
  out.archive = await fetch(base + "/api/archive", { headers: { "x-household": "home" } }).then((x) => x.json());
  return out;
}

const firstSentences = (t, n) => (t.match(/[^.!?]+[.!?]+\s*/g) || [t]).slice(0, n).join("").trim();
// excerpts for the film: drop the story title from quiz questions and from the "saved" line (replies are otherwise untouched)
const condense = (t) => t
  .replace(/In [^"]+? story "[^"]+", (\w)/g, (_, c) => c.toUpperCase())
  .replace(/Lovely: [^.]+\. Let's begin\. /, "")
  .replace(/ You've all been listening, and that is the real prize\./, "")
  .replace(/You've been listening\./, "")
  .replace(/kept "[^"]+" safe in the family archive with [^.]+\./, "kept it safe in the family archive.");

const FR = { voice: LANGS.fr.edge.hearth, rate: "+0%", pitch: "+0%" };
const hv = (l) => ({ voice: LANGS[l].edge.hearth, rate: "+0%", pitch: "+0%" });

// Beats in order. gap = silence after (seconds). cue = a visual/sound event keyed to the beat.
export function beatsFrom(c) {
  const B = [];
  const say = (scene, who, text, o = {}) => B.push({ scene, who, text, spec: o.spec || CAST[who], lang: o.lang || "en", gap: o.gap ?? 0.2, cue: o.cue, calls: o.calls, speak: o.speak ?? text, name: o.name, sub: o.sub });
  // --- the problem
  say("problem", "narrator", "In so many Nigerian homes, the best stories live in one place: grandma's memory.", { gap: 0.25 });
  say("problem", "narrator", "The Christmas journey. The first market day. The night the light went off.", { gap: 0.3 });
  say("problem", "narrator", "When she forgets, they are gone.", { gap: 0.5 });
  // --- the device
  say("device", "narrator", "This is Hearth. A small speaker for the kitchen counter, wrapped in Ankara cloth, with a Raspberry Pi inside.", { gap: 0.3 });
  say("inside", "narrator", "Inside: a Raspberry Pi, a microphone array that hears across the room, a speaker, and a ring of light.", { gap: 0.3 });
  say("inside", "narrator", "It knows who is speaking, and keeps every story private.", { gap: 0.4 });
  // --- family time
  say("family", "papa", "Hey Hearth.", { name: "Emeka", cue: "wake", gap: 0.4 });
  say("family", "hearth", c.a1.reply, { calls: c.a1.calls, cue: "recognise", gap: 0.3 });
  say("family", "papa", "Yes.", { name: "Emeka", gap: 0.25 });
  say("family", "hearth", c.a2.reply, { calls: c.a2.calls, gap: 0.35 });
  say("family", "papa", "Hey Hearth, let's have family time.", { name: "Emeka", cue: "wake", gap: 0.3 });
  say("family", "hearth", c.a3.reply, { calls: c.a3.calls, gap: 0.25 });
  say("family", "tunde", "Papa, Tunde and Chioma!", { name: "Tunde", gap: 0.25 });
  say("family", "hearth", condense(c.a4.reply), { calls: c.a4.calls, gap: 0.25 });
  say("family", "papa", c.qs[0].answer + ".", { name: "Emeka", gap: 0.2 });
  say("family", "hearth", condense(c.a5.reply), { calls: c.a5.calls, cue: "cheer", gap: 0.2 });
  say("family", "tunde", c.qs[1].choices.find((x) => x !== c.qs[1].answer) + "?", { name: "Tunde", gap: 0.2 });
  say("family", "hearth", condense(c.a6.reply), { calls: c.a6.calls, cue: "groan", gap: 0.2 });
  say("family", "chioma", "Papa always wins!", { name: "Chioma", gap: 0.5 });
  // --- grandma's story
  say("story", "grandma", "Hey Hearth, I want to tell you a story.", { name: "Mama Kemi", cue: "wake", gap: 0.25 });
  say("story", "hearth", firstSentences(c.b1.reply, 2), { calls: c.b1.calls, gap: 0.25 });
  say("story", "grandma", "It was nineteen ninety, in Kano, when your grandfather and I opened our first provision shop. I was so proud.", { name: "Mama Kemi", gap: 0.25 });
  say("story", "hearth", firstSentences(c.b2.reply, 1), { calls: c.b2.calls, gap: 0.25 });
  say("story", "grandma", "That's all.", { name: "Mama Kemi", gap: 0.25 });
  say("story", "hearth", condense(c.b4.reply), { calls: c.b4.calls, cue: "star", gap: 0.3 });
  // --- languages
  say("lang", "narrator", "And not everyone speaks English. Hearth does not make them.", { gap: 0.25 });
  say("lang", "mireille", "Hey Hearth, parle français.", { name: "Mireille", lang: "fr", cue: "wake", sub: "Hey Hearth, speak French.", gap: 0.25 });
  say("lang", "hearth", c.c1.reply, { calls: c.c1.calls, lang: "fr", spec: FR, sub: "Of course. We are speaking French now.", gap: 0.25 });
  const NAMES = { zh: "中文", es: "Español", hi: "हिन्दी" };
  for (const l of ["zh", "es", "hi"]) say("montage", "hearth", firstSentences(c.langs[l], 2), { lang: l, name: NAMES[l], spec: hv(l), sub: "Hello. Say Hey Hearth whenever you'd like to share a memory.", gap: 0.12 });
  say("montage", "narrator", "Seven languages. One family archive.", { gap: 0.5 });
  // --- memory and the future
  say("memory", "narrator", "Months later, a child asks.", { gap: 0.2 });
  say("memory", "tunde", "Hey Hearth, what did Mama Kemi say about the Christmas in the village?", { name: "Tunde", cue: "wake", gap: 0.25 });
  say("memory", "hearth", firstSentences(c.e1.reply, 2), { calls: c.e1.calls, gap: 0.25 });
  say("memory", "grandma", "Ah! I remember that day.", { name: "Mama Kemi", gap: 0.4 });
  say("future", "grandma", "Hey Hearth, I want to leave a message for my grandchildren.", { name: "Mama Kemi", cue: "wake", gap: 0.25 });
  say("future", "hearth", firstSentences(c.e2.reply, 1), { calls: c.e2.calls, gap: 0.25 });
  say("future", "grandma", "Be kind, work hard, and always call your mother.", { name: "Mama Kemi", gap: 0.25 });
  say("future", "narrator", "One day, a child who is not yet born will ask, and be answered.", { gap: 0.5 });
  // --- options, proof, end
  say("options", "narrator", "Use it as a stand-alone device on the counter, or open it in the browser of any phone.", { gap: 0.35 });
  say("proof", "narrator", "Every answer is a real tool call over MCP: capture a story, retrieve a memory, quiz the family. Built to be called by Alexa Plus.", { gap: 0.5 });
  say("end", "narrator", "Hearth. Because the stories we do not keep are the ones we lose first.", { gap: 0.2 });
  return B;
}
