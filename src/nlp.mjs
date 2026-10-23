// Local, language-aware helpers (en, es, fr, zh, pt, de, hi). Pure functions over an array of memories.
// Used as the offline engine and as the fallback whenever Bedrock is unavailable.
import { S, REL, EMO, EMO_WORD, PLACE_RE } from "./i18n.mjs";

const L = (lang) => S[lang] || S.en;
const STOP = new Set("Christmas Harmattan Yoruba Igbo Hausa Easter Ramadan Eid I The A An And But So Then When Where We He She They It My Our His Her Their This That There What Who Why How Well Oh Yes No Alexa Hearth In On At After Before One Every Back Monday Tuesday Wednesday Thursday Friday Saturday Sunday Mr Mrs Uncle Aunt January February March April May June July August September October November December Le La Les Un Une Il Elle Nous Je Tu Vous Ils Elles Mon Ma Mes Quand Mais Puis El Los Las Yo Tú Mi Sus Pero Entonces Cuando Ela Ele Eu Meu Minha Mas Quando Ich Wir Er Sie Es Der Die Das Und Aber Dann Wenn".split(" "));
const STOPWORDS = new Set("the a an and or of to in on at is was were it that this with for as by from about what did say tell me my our his her their who how when where why do does you i we he she they said story stories".split(" "));
const SYN = {
  job: ["work", "worked", "paycheck", "career", "boss", "employ", "hired"], work: ["job", "paycheck", "career"],
  wedding: ["married", "marry", "marriage", "bride"], married: ["wedding", "marry"], met: ["meet", "dance", "date", "first"], meet: ["met", "dance"],
  scared: ["afraid", "fear", "nervous", "frightened"], father: ["dad", "daddy"], dad: ["father", "daddy"], mother: ["mom", "mum", "mama"], mom: ["mother"],
  grandfather: ["grandpa"], grandpa: ["grandfather"], grandmother: ["grandma"], grandma: ["grandmother"], fishing: ["fish", "trout", "creek"], trip: ["drove", "drive", "vacation", "travel"],
  money: ["paycheck", "dollars", "wages", "rent"], war: ["army", "soldier", "draft", "service"], school: ["class", "teacher", "college", "graduated"], home: ["house", "kitchen", "farm"],
};
const stem = (w) => (/^[a-z']+$/.test(w) ? w.replace(/(ing|ed|es|s)$/, "").replace(/(.)\1$/, "$1") : w);
const CJK = /[㐀-鿿]/;
const SEG = typeof Intl !== "undefined" && Intl.Segmenter ? new Intl.Segmenter("zh", { granularity: "word" }) : null;

export function tokens(s) {
  const out = [];
  for (const w of s.toLowerCase().replace(/[^\p{L}\p{N}\p{M}' -]/gu, " ").split(/\s+/)) {
    if (!w || STOPWORDS.has(w)) continue;
    if (CJK.test(w)) {
      const cs = [...w].filter((c) => CJK.test(c));
      cs.forEach((c, i) => { out.push(c); if (cs[i + 1]) out.push(c + cs[i + 1]); });
      if (SEG) for (const g of SEG.segment(w)) if (g.isWordLike && g.segment.length > 2) out.push(g.segment);
    } else out.push(w);
  }
  return out;
}
const expand = (toks) => { const out = new Set(); for (const t of toks) { out.add(stem(t)); for (const s of SYN[t] || []) out.add(stem(s)); } return out; };

export function extract(text, lang = "en") {
  const people = new Set(), places = new Set(), dates = new Set(), emotions = new Set();
  const latin = ["en", "es", "fr", "pt"].includes(lang);
  if (latin) for (const m of text.matchAll(/(?<![.!?¿¡]\s)(?<!^)\b([A-ZÁÉÍÓÚÑÀÂÇÈÊÎÔÛ][a-záéíóúñàâçèêîôûü]{2,}(?:\s[A-ZÁÉÍÓÚÑÀÂÇÈÊÎÔÛ][a-záéíóúñàâçèêîôûü]{2,})*)\b/g)) {
    const words = m[1].split(" "); while (words.length && STOP.has(words[0])) words.shift();
    if (words.length) people.add(words.join(" "));
  }
  const pre = PLACE_RE[lang];
  if (pre) for (const m of text.matchAll(new RegExp(`(?<![\\p{L}])${pre}((?:[A-ZÁÉÍÓÚÑÀÂÇÈÊÎÔÛÄÖÜ][\\wáéíóúñàâçèêîôûüäöß]+)(?:\\s[A-ZÁÉÍÓÚÑÀÂÇÈÊÎÔÛÄÖÜ][\\wáéíóúñàâçèêîôûüäöß]+)*)`, "gu"))) { if (STOP.has(m[1])) continue; places.add(m[1]); }
  const placeWords = new Set([...places].flatMap((p) => p.split(" ")));
  for (const p of [...people]) if (places.has(p) || p.split(" ").every((w) => placeWords.has(w))) people.delete(p);
  if (lang === "zh") zhExtract(text, people, places, dates);
  if (lang === "hi") hiExtract(text, people, places);
  for (const m of text.matchAll(/\b((?:in |back in |around )?(?:19|20)\d\d|the (?:fifties|sixties|seventies|eighties|nineties)|(?:spring|summer|autumn|fall|winter) of (?:19|20)\d\d)\b/gi)) dates.add(m[1].replace(/^(in|back in|around) /i, ""));
  for (const m of text.matchAll(/((?:19|20)\d\d)\s*年/g)) dates.add(m[1] + "年");
  const lower = text.toLowerCase();
  for (const r of REL[lang] || REL.en) if (lower.includes(r)) people.add(r);
  if (lang !== "en") for (const r of REL.en) if (new RegExp(`\\b${r}\\b`).test(lower)) people.add(r);
  for (const [emo, words] of Object.entries(EMO)) if (words.some((w) => lower.includes(w))) emotions.add(emo);
  return { people: [...people], places: [...places], dates: [...dates], emotions: [...emotions] };
}

// ---- Chinese / Hindi heuristics (no capitalisation to lean on) ----
const ZH_NOT_PLACE = /^[第一这那我他她它很非常的]/;
const ZH_NAME_STOP = new Set(["一起", "我们", "他们", "她们", "自己", "大家", "朋友", "同事", "师傅", "老板"]);
const H = "[\\u4e00-\\u9fa5]";
function zhExtract(text, people, places, dates) {
  for (const m of text.matchAll(new RegExp(`(?:在|到了|来到|去了|回到|搬到|住在|前往)(${H}{2,4}?)(?:的|，|。|、|里|时|跳|工作|找|遇|认识|度过|举行|一家|厂|市|县|村|镇|街|学校|医院|附近|旁|上|下|边)`, "g"))) if (!ZH_NOT_PLACE.test(m[1])) places.add(m[1]);
  for (const m of text.matchAll(new RegExp(`(?:名叫|叫做|叫|名字是)(${H}{2,3})`, "g"))) if (!ZH_NAME_STOP.has(m[1])) people.add(m[1]);
  for (const m of text.matchAll(new RegExp(`(?:和|跟|与|同)(${H}{2,3}?)(?:一起|在|去|结婚|见面|跳舞|说|聊)`, "g"))) if (!ZH_NAME_STOP.has(m[1]) && !/^[我他她们这那]/.test(m[1])) people.add(m[1]);
  for (const m of text.matchAll(/(春|夏|秋|冬)天/g)) dates.add(m[0]);
  for (const m of text.matchAll(/(\d{1,2})月/g)) dates.add(m[0]);
  for (const m of text.matchAll(/([一二三四五六七八九〇零]{4})年/g)) dates.add(m[1] + "年");
}
const HI_STOP = new Set(["गर्मियों", "सर्दियों", "बारिश", "हो", "जम", "थी", "थे", "था", "हुई", "हुआ", "हँसी", "रात", "दिन", "मैं", "मुझे", "हम", "हमें", "वह", "वे", "उन्होंने", "उसने", "उस", "इस", "यह", "वो", "आप", "तुम", "बहुत", "फिर", "तब", "जब", "और", "लेकिन", "भी", "सब", "कोई", "एक", "मेरे", "मेरी", "मेरा", "हमारे", "हमारी", "उनके", "उसके", "अपने", "पहले", "बाद"]);
function hiExtract(text, people, places) {
  for (const m of text.matchAll(/([ऀ-ॿ]{2,})\s+में(?=[\s,।.]|$)/g)) if (!HI_STOP.has(m[1])) places.add(m[1]);
  for (const m of text.matchAll(/([ऀ-ॿ]{2,})\s+(?:गए|गई|गया|गयी|पहुँचे|पहुँची|पहुंचे|पहुंची|आए|आई|आया)/g)) if (!HI_STOP.has(m[1]) && !/^(?:वहाँ|यहाँ|कल|कभी|फिर|सब|हम|मैं|वह|तब)$/.test(m[1])) places.add(m[1]);
  for (const m of text.matchAll(/(?:बहन|भाई|चाचा|चाची|मामा|मौसी|दोस्त|पड़ोसी)\s+([ऀ-ॿ]{2,})/g)) if (!HI_STOP.has(m[1]) && !/^(?:और|का|की|के|ने|को|से|में)$/.test(m[1])) people.add(m[1]);
  for (const m of text.matchAll(/([ऀ-ॿ]{2,})\s+(?:के साथ|ने|को)(?=[\s,।.]|$)/g)) if (!HI_STOP.has(m[1]) && !places.has(m[1]) && !REL.hi.includes(m[1])) people.add(m[1]);
}

// A real interviewer reacts to what was said before asking the next thing.
export function reaction(known, lang = "en") {
  const s = L(lang), emo = known.emotions[0];
  const named = known.people.find((p) => /^[A-ZÀ-Ý]/.test(p)) || known.people[0];
  const r = s.react[emo] || s.react.generic;
  return named && Math.random() < 0.5 ? `${r} ${s.about(named)}` : r;
}

export function followups(text, known = extract(text), lang = "en") {
  const f = L(lang).fu, q = [];
  if (!known.dates.length) q.push(f.when);
  if (!known.places.length) q.push(f.where);
  if (known.people.length < 2) q.push(f.who);
  if (!known.emotions.length) q.push(f.feel);
  q.push(f.detail);
  return q.slice(0, 3);
}

export function newMemory({ teller, title, text, people, places, dates, emotions, source, lang = "en" }) {
  const auto = extract(text, lang);
  const first = text.split(/[.!?。！？]/)[0].trim();
  return {
    id: "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    teller: teller || "Family", lang,
    title: title || (first.length > 48 ? first.slice(0, Math.max(20, first.lastIndexOf(" ", 45))) + "…" : first),
    text,
    people: people?.length ? people : auto.people, places: places?.length ? places : auto.places,
    dates: dates?.length ? dates : auto.dates, emotions: emotions?.length ? emotions : auto.emotions,
    source: source || "voice", createdAt: new Date().toISOString(),
  };
}

// Hybrid ranker: IDF-weighted stems + synonym expansion + teller boost. `semantic` (optional) maps id -> cosine from embeddings.
export function rank(mems, query, { teller, semantic } = {}) {
  const pool = mems.filter((m) => !teller || m.teller.toLowerCase().includes(teller.toLowerCase()) || teller.toLowerCase().includes(m.teller.toLowerCase().split(" ").pop()));
  const docs = pool.map((m) => ({ m, set: expand(tokens([m.title, m.text, m.people.join(" "), m.places.join(" "), m.dates.join(" ")].join(" "))) }));
  const df = {}; for (const d of docs) for (const t of d.set) df[t] = (df[t] || 0) + 1;
  const q = expand(tokens(query));
  return docs
    .map(({ m, set }) => {
      let score = 0; for (const t of q) if (set.has(t)) score += Math.log(1 + docs.length / (df[t] || 1));
      if (semantic?.[m.id]) score += 4 * semantic[m.id];
      return { m, score };
    })
    .filter((x) => x.score > (semantic ? 0.5 : 0))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.m);
}

// Spoken retelling. `narrate` adds storyteller framing (used for "tell me about..." requests).
export function summarize(m, lang = m.lang || "en", { narrate = false } = {}) {
  const s = L(lang).sum, sep = lang === "zh" ? "" : " ";
  const sents = m.text.split(/(?<=[.!?。！？])\s*/).filter(Boolean);
  const body = narrate || sents.length <= 3 ? m.text : [sents[0], sents[Math.floor(sents.length / 2)], sents[sents.length - 1]].join(sep);
  const when = m.dates[0] ? s.when(m.dates[0], m.places[0]) : m.places[0] ? s.where(m.places[0]) : "";
  const em = m.emotions.map((e) => EMO_WORD[lang]?.[e] || e).join(s.and);
  return (narrate ? [body, em ? s.feel(em) : ""] : [s.told(m.title, m.teller), when, body, em ? s.feel(em) : ""]).filter(Boolean).join(sep);
}

const pick = (arr, n) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);

export function makeQuiz(all, teller, count = 3, lang = "en") {
  const q = L(lang).q;
  const mems = all.filter((m) => !teller || m.teller.toLowerCase().includes(teller.toLowerCase()) || teller.toLowerCase().includes(m.teller.toLowerCase().split(" ").pop()));
  const uniq = (f) => [...new Set(all.flatMap(f))];
  const places = uniq((m) => m.places), dates = uniq((m) => m.dates), people = uniq((m) => m.people).filter((p) => /^[A-ZÀ-Ý]/.test(p));
  const qs = [];
  for (const m of mems) {
    const lead = q.lead(m.teller, m.title);
    const add = (question, answer, pool) => qs.push({ memoryId: m.id, question: `${lead}, ${question}`, answer, choices: pick([answer, ...pick(pool.filter((p) => p !== answer), 2)], 3) });
    if (m.places[0] && places.length > 2) add(q.where, m.places[0], places);
    if (m.dates[0] && dates.length > 2) add(q.when, m.dates[0], dates);
    const named = m.people.find((p) => /^[A-ZÀ-Ý]/.test(p));
    if (named && people.length > 2) add(q.who, named, people.filter((p) => !m.people.includes(p)));
  }
  const byMem = new Map();
  for (const x of pick(qs, qs.length)) byMem.set(x.memoryId, [...(byMem.get(x.memoryId) || []), x]);
  const rounds = [], lists = pick([...byMem.values()], byMem.size);
  for (let r = 0; rounds.length < count; r++) { const before = rounds.length; for (const l of lists) if (l[r] && rounds.length < count) rounds.push(l[r]); if (rounds.length === before) break; }
  return rounds;
}

export function checkAnswer(answer, correct) {
  const a = answer.toLowerCase().trim(), c = correct.toLowerCase();
  return a.includes(c) || (a.length > 1 && c.includes(a));
}

export function timeline(mems) {
  const yearOf = (m) => { const y = (m.dates.join(" ").match(/(19|20)\d\d/) || [])[0]; return y ? +y : null; };
  return mems.map((m) => ({ id: m.id, title: m.title, teller: m.teller, year: yearOf(m), when: m.dates[0] || null })).sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999));
}

export function graph(mems) {
  const nodes = new Map(), links = new Map();
  const node = (id, type) => nodes.set(id, { id, type, n: (nodes.get(id)?.n || 0) + 1 });
  for (const m of mems) {
    node(m.teller, "teller");
    for (const p of [...m.people, ...m.places]) { node(p, m.places.includes(p) ? "place" : "person"); const k = `${m.teller}|${p}`; links.set(k, (links.get(k) || 0) + 1); }
  }
  return { nodes: [...nodes.values()], links: [...links].map(([k, w]) => ({ source: k.split("|")[0], target: k.split("|")[1], w })) };
}

const PROMPTS = {
  en: ["What is the earliest thing you remember about your childhood home?", "Tell me about your first job and what it taught you.", "Who was the person who shaped you most, and why?", "What song takes you straight back to a certain moment in your life?", "What advice would you give your grandchildren that you wish someone had told you?", "What is a family recipe you never want lost?"],
  es: ["¿Cuál es el primer recuerdo que tienes de la casa de tu infancia?", "Cuéntame sobre tu primer trabajo y lo que te enseñó.", "¿Quién fue la persona que más te marcó y por qué?", "¿Qué canción te lleva de inmediato a un momento de tu vida?", "¿Qué receta familiar no quieres que se pierda nunca?"],
  fr: ["Quel est votre premier souvenir de la maison de votre enfance ?", "Parlez-moi de votre premier travail et de ce qu'il vous a appris.", "Qui est la personne qui vous a le plus marqué, et pourquoi ?", "Quelle chanson vous ramène tout de suite à un moment de votre vie ?", "Quelle recette de famille ne voudriez-vous jamais perdre ?"],
  zh: ["你对童年的家，最早的记忆是什么？", "说说你的第一份工作，它教会了你什么？", "谁对你影响最大？为什么？", "哪一首歌会让你立刻想起人生中的某一刻？", "有哪道家传菜，你不希望它失传？"],
  pt: ["Qual é a sua lembrança mais antiga da casa da sua infância?", "Conte-me sobre o seu primeiro emprego e o que ele lhe ensinou.", "Quem foi a pessoa que mais marcou você, e por quê?", "Que música leva você direto a um momento da sua vida?", "Qual receita de família você nunca quer que se perca?"],
  de: ["Was ist deine früheste Erinnerung an das Haus deiner Kindheit?", "Erzähl mir von deinem ersten Job und was er dich gelehrt hat.", "Wer hat dich am meisten geprägt, und warum?", "Welches Lied bringt dich sofort zu einem bestimmten Moment deines Lebens zurück?", "Welches Familienrezept soll nie verloren gehen?"],
  hi: ["अपने बचपन के घर की सबसे पहली याद क्या है?", "अपनी पहली नौकरी के बारे में बताइए और उसने आपको क्या सिखाया।", "वह कौन था जिसने आपको सबसे ज़्यादा गढ़ा, और क्यों?", "कौन सा गाना आपको तुरंत जीवन के किसी खास पल में ले जाता है?", "परिवार की कौन सी रेसिपी आप कभी खोना नहीं चाहते?"],
};
export const dailyPrompt = (date = new Date(), lang = "en") => { const p = PROMPTS[lang] || PROMPTS.en; return p[Math.floor(date / 864e5) % p.length]; };
