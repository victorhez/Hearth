// Optional AWS Bedrock (Claude + Titan embeddings). Enabled when BEDROCK_MODEL_ID is set.
// Every helper returns null on failure so callers fall back to the local engine.
import { BedrockRuntimeClient, ConverseCommand, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

export const enabled = () => !!process.env.BEDROCK_MODEL_ID;
let client;
export const _setClient = (c) => { client = c; };
const bedrock = () => (client ||= new BedrockRuntimeClient({ region: process.env.AWS_REGION || "us-east-1" }));

export async function converse(params) {
  return bedrock().send(new ConverseCommand({ modelId: process.env.BEDROCK_MODEL_ID, inferenceConfig: { maxTokens: 1024, temperature: 0.4 }, ...params }));
}

async function askJson(system, user) {
  const r = await converse({ system: [{ text: system + " Reply with a single JSON value and nothing else." }], messages: [{ role: "user", content: [{ text: user }] }] });
  const t = r.output.message.content[0].text;
  return JSON.parse(t.slice(t.search(/[\[{]/), Math.max(t.lastIndexOf("}"), t.lastIndexOf("]")) + 1));
}

async function safe(fn) {
  if (!enabled()) return null;
  try { return await fn(); } catch (e) { console.error("[bedrock fallback]", e.message); return null; }
}

export const llmExtract = (text) => safe(async () => {
  const j = await askJson("You structure a family oral-history story. Return {title, people:[names or relations], places:[], dates:[], emotions:[]}.", text);
  return { title: j.title, people: j.people, places: j.places, dates: j.dates, emotions: j.emotions };
});

export const llmFollowups = (text, lang = "en") => safe(async () => {
  const j = await askJson("You are a warm, gentle interviewer for an elder sharing a memory. Return a JSON array of at most 3 short spoken follow-up questions about missing details (when, where, who, feelings, sensory detail). Never repeat what was already said. Write the questions in the language with code " + lang + ".", text);
  return j.slice(0, 3);
});

export const llmQuiz = (mems, count, lang = "en") => safe(async () => {
  const stories = mems.map((m) => ({ memoryId: m.id, teller: m.teller, title: m.title, text: m.text }));
  const j = await askJson(`Write ${count} respectful multiple-choice quiz questions (3 choices each) testing recall of facts in these family stories. Return [{memoryId, question, answer, choices:[...]}] where answer is one of choices. Write questions and choices in the language with code ${lang}.`, JSON.stringify(stories));
  return j.filter((q) => q.memoryId && q.question && q.choices?.includes(q.answer)).slice(0, count);
});

// Titan embeddings for semantic retrieval (cached per text).
const cache = new Map();
async function embedOne(text) {
  if (cache.has(text)) return cache.get(text);
  const r = await bedrock().send(new InvokeModelCommand({ modelId: process.env.BEDROCK_EMBED_MODEL_ID || "amazon.titan-embed-text-v2:0", contentType: "application/json", body: JSON.stringify({ inputText: text.slice(0, 8000) }) }));
  const v = JSON.parse(new TextDecoder().decode(r.body)).embedding; cache.set(text, v); return v;
}
const cos = (a, b) => { let d = 0, x = 0, y = 0; for (let i = 0; i < a.length; i++) { d += a[i] * b[i]; x += a[i] * a[i]; y += b[i] * b[i]; } return d / Math.sqrt(x * y); };
export const semanticScores = (query, mems) => safe(async () => {
  if (!process.env.BEDROCK_EMBED_MODEL_ID && process.env.LEGACYLINK_EMBED !== "1") return null;
  const q = await embedOne(query), out = {};
  for (const m of mems) out[m.id] = Math.max(0, cos(q, await embedOne(`${m.title}. ${m.text}`)));
  return out;
});
