// The conversational layer ("Hearth" / simulated Alexa+). It never touches the archive directly:
// every fact comes from MCP tool calls made over Streamable HTTP, the same way Alexa+ would call them.
//   - With Bedrock enabled: a Claude tool-use loop decides which MCP tools to call (any language).
//   - Otherwise: a deterministic intent router (7 languages) drives the same tools.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import * as AI from "./llm.mjs";
import { S, INTENT, LANGS, LANG_NAMES, SWITCH_RE, CODES } from "./i18n.mjs";
import { parseNames } from "./i18n2.mjs";
import { getConversation, setConversation } from "./store.mjs";

const sessions = new Map();
export const session = async (id, teller, lang) => {
  let s = process.env.VERCEL ? await getConversation(id) : sessions.get(id);
  if (s) sessions.set(id, s);
  if (!s) sessions.set(id, s = { teller, lang: lang || "en", history: [] });
  if (teller) s.teller = teller;
  if (lang && CODES.includes(lang)) s.lang = lang;
  return s;
};

export async function mcp(household, token, url) {
  const base = url || process.env.LEGACYLINK_MCP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/mcp` : `http://127.0.0.1:${process.env.PORT || 3333}/mcp`);
  const client = new Client({ name: "hearth", version: "2.0.0" });
  const headers = { "x-household": household, ...(token ? { authorization: `Bearer ${token}` } : {}) };
  await client.connect(new StreamableHTTPClientTransport(new URL(base), { requestInit: { headers } }));
  return client;
}

const parse = (r) => { const t = r.content?.[0]?.text ?? "{}"; try { return JSON.parse(t); } catch { return { text: t }; } };

export async function handle({ sid, utterance, teller, lang, speaker, household, token, mcpUrl, client: injected }) {
  const st = await session(sid, teller, lang), calls = [];
  const client = injected || (await mcp(household, token, mcpUrl));
  const call = async (name, args) => { const result = parse(await client.callTool({ name, arguments: args })); calls.push({ tool: name, args, result }); return result; };
  try {
    const sp = speakerFlow(st, utterance, speaker);
    if (sp) return { ...sp, lang: st.lang, teller: st.teller, calls, engine: "local" };
    const out = AI.enabled() && !st.family ? await agent(st, utterance, client, calls) : null;
    if (out) return { ...out, lang: st.lang, teller: st.teller, calls, engine: "bedrock-agent" };
    return { ...(await rules(st, utterance, call)), lang: st.lang, teller: st.teller, calls, engine: "local" };
  } finally {
    if (!injected) await client.close().catch(() => {});
    if (process.env.VERCEL) await setConversation(sid, st);
  }
}

// ---------- Bedrock tool-use agent ----------
const SYSTEM = (teller, lang) => `You are Hearth, a warm, unhurried voice that lives in a family's kitchen and keeps their stories safe. You are speaking aloud to ${teller}. Speak and understand ${LANGS[lang]?.name || "English"} (language code ${lang}); pass lang="${lang}" to every tool that accepts it, and reply in that language unless the person asks to switch.
Rules: speak in 1-3 short sentences, react briefly and humanly to what you hear before asking anything, no lists, no markdown, no emojis. You are an interviewer first: when someone shares a memory, ask ONE gentle follow-up at a time (when, where, who, how it felt). When they have finished, call capture_story with the full story in their own words and tell them it is safe.
Always use the tools for facts about the family; never invent stories. Use retrieve_memory then summarize_story (narrate=true) to answer "what did X say about Y", and offer to tell another. For quizzes call generate_quiz, ask one question at a time, and call check_answer. If asked for inspiration use daily_prompt.`;

async function agent(st, utterance, client, calls) {
  try {
    const { tools } = await client.listTools();
    const toolConfig = { tools: tools.map((t) => ({ toolSpec: { name: t.name, description: t.description, inputSchema: { json: t.inputSchema } } })) };
    st.history.push({ role: "user", content: [{ text: utterance }] });
    for (let round = 0; round < 6; round++) {
      const r = await AI.converse({ system: [{ text: SYSTEM(st.teller, st.lang) }], messages: st.history, toolConfig });
      const msg = r.output.message; st.history.push(msg);
      const uses = msg.content.filter((c) => c.toolUse);
      if (!uses.length) { st.history = st.history.slice(-24); return { reply: msg.content.map((c) => c.text || "").join(" ").trim(), mood: "warm", nod: true }; }
      const results = [];
      for (const { toolUse } of uses) {
        const res = parse(await client.callTool({ name: toolUse.name, arguments: toolUse.input }));
        calls.push({ tool: toolUse.name, args: toolUse.input, result: res });
        results.push({ toolResult: { toolUseId: toolUse.toolUseId, content: [{ json: res.text ? { text: res.text } : res }] } });
      }
      st.history.push({ role: "user", content: results });
    }
    return { reply: "...", mood: "warm" };
  } catch (e) { console.error("[agent fallback]", e.message); st.history = []; calls.length = 0; return null; }
}

// ---------- who is speaking? (the device sends its voice-recognition guess as `speaker`) ----------
function speakerFlow(st, u, speaker) {
  const T = S[st.lang], clean = stripWake(u || ""), lower = clean.toLowerCase();
  const yes = (t) => T.yes.test(t) || /^(correct|right|that'?s right)/.test(t);
  if (st.pendingSpeaker) {
    const p = st.pendingSpeaker;
    if (p.ask) { // we asked "who is this?"
      const name = clean.replace(/^(it'?s|this is|i am|i'm|soy|je suis|我是|ich bin|eu sou|मैं)\s+/i, "").replace(/[.!?。！？]+$/g, "").trim();
      if (name) { st.pendingSpeaker = null; st.teller = name; return { reply: T.sp.hello(name), mood: "joy", nod: true }; }
    } else if (yes(lower)) { st.pendingSpeaker = null; st.teller = p.name; return { reply: T.sp.hello(p.name), mood: "joy", nod: true }; }
    else if (T.nope.test(lower)) { st.pendingSpeaker = { ask: true }; return { reply: T.sp.who, mode: "confirm" }; }
    else st.pendingSpeaker = null; // anything else: carry on normally
  }
  if (speaker?.name && speaker.name !== st.teller) {
    if (!clean) { st.pendingSpeaker = { name: speaker.name }; return { reply: T.sp.sounds(speaker.name), mode: "confirm" }; }
    if ((speaker.score ?? 1) >= 0.7) st.teller = speaker.name;
  }
  if (!clean) return { reply: T.here };
  return null;
}

// ---------- family time: a guided quiz that rotates between the people in the room ----------
async function familyStep(st, clean, call, say) {
  const F = st.family, ft = S[st.lang].ft, T = S[st.lang];
  if (F.stage === "names") {
    const players = parseNames(clean, st.lang);
    if (!players.length) return say(ft.ask, { mode: "family" });
    const r = await call("generate_quiz", { count: Math.min(5, Math.max(1, Number(process.env.LEGACYLINK_FAMILY_ROUNDS) || 5)), lang: st.lang });
    if (!r.questions.length) { st.family = null; return say(T.noQuiz); }
    Object.assign(F, { stage: "play", players, qs: r.questions, i: 0, scores: Object.fromEntries(players.map((p) => [p, 0])) });
    return say(ft.start(players.join(ft.sep)) + " " + ft.turn(players[0], F.qs[0].question, F.qs[0].choices.join(", ")), { mode: "family", nod: true });
  }
  const q = F.qs[F.i], who = F.players[F.i % F.players.length];
  const res = await call("check_answer", { answer: clean, correct: q.answer, memoryId: q.memoryId, lang: st.lang });
  if (res.correct) F.scores[who]++;
  F.i++;
  if (F.i < F.qs.length) {
    const n = F.qs[F.i];
    return say(ft.next(res.feedback, F.players[F.i % F.players.length], n.question, n.choices.join(", ")), { mode: "family", mood: res.correct ? "joy" : "warm", nod: true });
  }
  st.family = null;
  const ranked = Object.entries(F.scores).sort((a, b) => b[1] - a[1]), top = ranked[0][1], winners = ranked.filter(([, s]) => s === top);
  const board = ranked.map(([n, s]) => ft.score(n, s)).join(ft.sep);
  return say(res.feedback + " " + ft.end(board, winners.length === 1 ? ft.win(winners[0][0]) : ft.tie), { mood: "joy" });
}

// ---------- deterministic router (7 languages) ----------
const stripWake = (u) => u.replace(/^\s*(?:(?:hey|hi|ok|okay|hello|hola|oye|salut|bonjour|olá|ola|hallo|你好|嘿|嗨|नमस्ते)[ ,，]*)?(?:hearth|alexa|壁炉|हर्थ)[ ,，.!。]*/i, "").trim();

function detectSwitch(lower) {
  for (const code of CODES) for (const n of LANG_NAMES[code]) {
    if (lower === n || (lower.includes(n) && SWITCH_RE.test(lower))) return code;
  }
  return null;
}

async function rules(st, u, call) {
  const clean = stripWake(u), lower = clean.toLowerCase();
  const T = S[st.lang], I = INTENT[st.lang], E = INTENT.en;
  const say = (reply, extra = {}) => ({ reply, mood: "warm", ...extra });

  const sw = detectSwitch(lower);
  if (sw && (sw !== st.lang || lower.length < 24)) {
    st.lang = sw; st.story = st.quiz = st.offer = null;
    return say(S[sw].switched(LANGS[sw].native), { mood: "joy" });
  }

  if (st.family) return familyStep(st, clean, call, say);

  if (st.quiz) {
    const q = st.quiz.questions[st.quiz.i];
    const res = await call("check_answer", { answer: clean, correct: q.answer, memoryId: q.memoryId, lang: st.lang });
    st.quiz.score += res.correct ? 1 : 0; st.quiz.i++;
    if (st.quiz.i < st.quiz.questions.length) {
      const n = st.quiz.questions[st.quiz.i];
      return say(T.quizNext(res.feedback, n.question, n.choices.join(", ")), { mode: "quiz", mood: res.correct ? "joy" : "warm", nod: res.correct });
    }
    const { score } = st.quiz, total = st.quiz.questions.length; st.quiz = null;
    return say(T.quizDone(res.feedback, score, total), { mood: "joy" });
  }

  if (st.story) {
    if (I.done.test(lower) || E.done.test(lower)) {
      const r = await call("capture_story", { teller: st.story.teller, text: st.story.parts.join(" "), lang: st.lang, ...(st.story.legacy ? { title: T.legacy.title } : {}) });
      st.story = null; const m = r.memory;
      const bits = [m.people.slice(0, 3).join(", "), m.places[0], m.dates[0]].filter(Boolean).join(", ");
      return say(T.saved(m.title, bits), { saved: m.id, mood: "joy" });
    }
    st.story.parts.push(clean);
    if (st.story.legacy) return say(T.more, { mode: "story", mood: "listen", nod: true }); // a message to the future is not interviewed
    const r = await call("ask_followup", { text: st.story.parts.join(" "), lang: st.lang });
    const next = r.questions.find((q) => !st.story.asked.has(q));
    if (!next || st.story.asked.size >= 3) return say(`${r.reaction} ${T.more}`, { mode: "story", mood: "listen", nod: true });
    st.story.asked.add(next);
    return say(`${r.reaction} ${next}`, { mode: "story", mood: "listen", nod: true });
  }

  if (st.offer) {
    const offer = st.offer; st.offer = null;
    if (T.yes.test(lower) && offer.length) {
      const id = offer.shift();
      const s = await call("summarize_story", { id, narrate: true, lang: st.lang });
      if (offer.length) st.offer = offer;
      return say(s.spoken + (offer.length ? " " + T.offer : ""), { story: id, nod: true });
    }
    if (T.nope.test(lower)) return say(T.thanks);
  }

  let m;
  if (I.family.test(lower) || E.family.test(lower)) { st.family = { stage: "names" }; return say(T.ft.ask, { mode: "family" }); }
  if (I.legacy.test(lower) || E.legacy.test(lower)) {
    st.story = { teller: st.teller, parts: [], asked: new Set(), legacy: true };
    return say(T.legacy.start(st.teller), { mode: "story", mood: "listen" });
  }
  if (I.enroll.test(lower) || E.enroll.test(lower)) return say(T.enroll.askName, { action: "enroll", mode: "enroll" });
  if (I.tell.test(lower) || E.tell.test(lower)) {
    st.story = { teller: st.teller, parts: [], asked: new Set() };
    return say(T.tell(st.teller), { mode: "story", mood: "listen" });
  }
  if (I.quiz.test(lower) || E.quiz.test(lower)) {
    const teller = ((clean.match(I.quizOn) || clean.match(E.quizOn) || [])[1] || "").trim() || undefined;
    const r = await call("generate_quiz", { teller, count: 3, lang: st.lang });
    if (!r.questions.length) return say(T.noQuiz);
    st.quiz = { questions: r.questions, i: 0, score: 0 };
    const q = r.questions[0];
    return say(T.quizStart(q.question, q.choices.join(", ")), { mode: "quiz" });
  }
  if (I.prompt.test(lower) || E.prompt.test(lower)) return say((await call("daily_prompt", { lang: st.lang })).prompt, { mood: "listen" });
  if ((m = lower.match(I.ask) || lower.match(E.ask))) {
    const who = m[1].replace(/^(my|our|mi|mis|mon|ma|mes|meu|minha|mein|meine|我的|我)\s*/i, "").trim(), topic = m[2];
    let r = await call("retrieve_memory", { query: topic, teller: who, limit: 5 });
    if (!r.matches.length) r = await call("retrieve_memory", { query: `${who} ${topic}`, limit: 5 });
    if (!r.matches.length) return say(T.noStory);
    return retell(st, call, r.matches);
  }
  if (I.who.test(lower) || E.who.test(lower)) {
    const r = await call("list_storytellers", {});
    return say(T.who(Object.entries(r).map(([k, v]) => T.whoItem(k, v)).join(", ")));
  }
  if (I.thanks.test(lower) || E.thanks.test(lower)) return say(T.thanks);
  const r = await call("retrieve_memory", { query: clean, limit: 5 });
  if (r.matches.length) return retell(st, call, r.matches);
  return say(T.help);
}

// Retell as a story, then offer the next related one: a back-and-forth, not a lookup.
async function retell(st, call, matches) {
  const T = S[st.lang], first = matches[0];
  const s = await call("summarize_story", { id: first.id, narrate: true, lang: st.lang });
  const rest = matches.slice(1).map((x) => x.id);
  if (rest.length) st.offer = rest;
  return { reply: s.spoken + (rest.length ? " " + T.offer : ""), mood: "warm", story: first.id, nod: true };
}
