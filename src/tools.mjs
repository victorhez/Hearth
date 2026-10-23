// The MCP surface. buildServer(household) returns an McpServer whose tools operate on one family's archive.
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as N from "./nlp.mjs";
import * as AI from "./llm.mjs";
import { forHousehold } from "./store.mjs";
import { S } from "./i18n.mjs";

const txt = (obj) => ({ content: [{ type: "text", text: typeof obj === "string" ? obj : JSON.stringify(obj, null, 2) }] });

export async function findMemories(store, query, teller) {
  const all = await store.all();
  const semantic = await AI.semanticScores(query, all);
  return N.rank(all, query, { teller, semantic: semantic || undefined });
}

export function buildServer(household = "home") {
  const store = forHousehold(household);
  const s = new McpServer({ name: "legacylink", version: "2.0.0" });

  s.registerTool("capture_story", {
    description: "Save a story told by a family member. Extracts people, places, dates and emotions, stores it privately, and returns follow-up questions to ask next.",
    inputSchema: { teller: z.string().describe("Who is telling the story, e.g. Grandma Rose"), text: z.string().describe("The story in the teller's words"), title: z.string().optional(), lang: z.string().optional().describe("Language code: en, es, fr, zh, pt, de or hi") },
  }, async ({ teller, text, title, lang }) => {
    const x = (await AI.llmExtract(text)) || {};
    const memory = await store.add(N.newMemory({ teller, text, title: title || x.title, lang: lang || "en", ...x }));
    return txt({ saved: true, engine: x.title ? "bedrock" : "local", memory, followups: (await AI.llmFollowups(text, lang || "en")) || N.followups(text, memory, lang || "en") });
  });

  s.registerTool("ask_followup", {
    description: "Given a story in progress, suggest up to 3 gentle follow-up questions for missing details (when, where, who, feeling).",
    inputSchema: { text: z.string(), lang: z.string().optional().describe("Language code: en, es, fr, zh, pt, de or hi") },
  }, async ({ text, lang }) => {
    const l = lang || "en", known = N.extract(text, l);
    return txt({ extracted: known, reaction: N.reaction(known, l), questions: (await AI.llmFollowups(text, l)) || N.followups(text, known, l) });
  });

  s.registerTool("store_memory", {
    description: "Store a memory with explicit structured fields when the agent has already structured the story itself.",
    inputSchema: { teller: z.string(), title: z.string(), text: z.string(), people: z.array(z.string()).optional(), places: z.array(z.string()).optional(), dates: z.array(z.string()).optional(), emotions: z.array(z.string()).optional(), lang: z.string().optional().describe("Language code: en, es, fr, zh, pt, de or hi") },
  }, async (a) => txt({ saved: true, memory: await store.add(N.newMemory(a)) }));

  s.registerTool("retrieve_memory", {
    description: "Find stored memories relevant to a question (semantic + keyword), optionally limited to one family member's stories.",
    inputSchema: { query: z.string(), teller: z.string().optional(), limit: z.number().int().min(1).max(10).optional() },
  }, async ({ query, teller, limit }) => txt({ matches: (await findMemories(store, query, teller)).slice(0, limit ?? 3) }));

  s.registerTool("summarize_story", {
    description: "Produce a short, natural, speakable retelling of a stored story, by id or by search query.",
    inputSchema: { id: z.string().optional(), query: z.string().optional(), narrate: z.boolean().optional().describe("Tell it as a story with a storyteller's framing"), lang: z.string().optional().describe("Language code: en, es, fr, zh, pt, de or hi") },
  }, async ({ id, query, narrate, lang }) => {
    const m = id ? (await store.all()).find((x) => x.id === id) : (await findMemories(store, query || ""))[0];
    const l = lang || m?.lang || "en";
    return m ? txt({ id: m.id, spoken: (narrate ? S[l].retellIntro(m.title, m.teller) + " " : "") + N.summarize(m, m.lang || l, { narrate }) }) : txt({ spoken: S[l].noStory });
  });

  s.registerTool("generate_quiz", {
    description: "Create a short, respectful multiple-choice quiz from stored family stories.",
    inputSchema: { teller: z.string().optional(), count: z.number().int().min(1).max(5).optional(), lang: z.string().optional().describe("Language code: en, es, fr, zh, pt, de or hi") },
  }, async ({ teller, count, lang }) => {
    const n = count ?? 3, all = await store.all();
    const mems = all.filter((m) => !teller || m.teller.toLowerCase().includes(teller.toLowerCase()));
    const q = mems.length ? await AI.llmQuiz(mems, n, lang || "en") : null;
    return txt({ engine: q?.length ? "bedrock" : "local", questions: q?.length ? q : N.makeQuiz(all, teller, n, lang || "en") });
  });

  s.registerTool("check_answer", {
    description: "Check a quiz answer and return warm feedback.",
    inputSchema: { answer: z.string(), correct: z.string(), memoryId: z.string().optional(), lang: z.string().optional().describe("Language code: en, es, fr, zh, pt, de or hi") },
  }, async ({ answer, correct, memoryId, lang }) => {
    const l = lang || "en";
    const ok = N.checkAnswer(answer, correct), m = memoryId && (await store.all()).find((x) => x.id === memoryId);
    return txt({ correct: ok, feedback: ok ? S[l].right : S[l].wrong(correct), story: m ? N.summarize(m, m.lang || l) : undefined });
  });

  s.registerTool("list_storytellers", { description: "List family members who have stories in the archive and how many.", inputSchema: {} }, async () => {
    const c = {}; for (const m of await store.all()) c[m.teller] = (c[m.teller] || 0) + 1;
    return txt(c);
  });

  s.registerTool("get_timeline", { description: "The family's stories ordered by year.", inputSchema: {} }, async () => txt({ timeline: N.timeline(await store.all()) }));
  s.registerTool("daily_prompt", { description: "A gentle story prompt for today to invite a family member to share.", inputSchema: { lang: z.string().optional().describe("Language code: en, es, fr, zh, pt, de or hi") } }, async ({ lang }) => txt({ prompt: N.dailyPrompt(new Date(), lang || "en") }));

  return s;
}
