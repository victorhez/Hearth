import test from "node:test";
import assert from "node:assert/strict";
process.env.LEGACYLINK_DATA_DIR = new URL("./tmpdata", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1").replace(/%20/g, " ");
process.env.PORT = "3399";
const { createApp } = await import("../src/server.mjs");
const AI = await import("../src/llm.mjs");
const { forHousehold } = await import("../src/store.mjs");
const { newMemory } = await import("../src/nlp.mjs");

const srv = createApp().listen(3399);
test.after(() => srv.close());
const say = (utterance, session = "t") => fetch("http://127.0.0.1:3399/api/say", { method: "POST", headers: { "content-type": "application/json", "x-household": "t" }, body: JSON.stringify({ session, utterance, teller: "Grandma Rose" }) }).then((r) => r.json());

test("seed + interview + retrieval + quiz through real MCP over HTTP", async () => {
  const st = forHousehold("t"); await st.clear();
  for (const [t, title, text] of [
    ["Grandma Rose", "My first job at the bakery", "In 1958 I got my first job at Kowalski Bakery in Dayton. I was proud of my first paycheck."],
    ["Dad", "Fishing", "In 1975 my father Walter took me fishing at Eagle Creek and I was happy."],
    ["Dad", "Yellowstone", "In 1994 we drove to Yellowstone with Uncle Frank and got scared near Lake Hotel."],
  ]) await st.add(newMemory({ teller: t, title, text }));

  let r = await say("I want to tell you about how we met");
  assert.equal(r.mode, "story");
  r = await say("I met Henry at the Lakeside Cafe in 1971. He spilled coffee on my coat and I was so happy.");
  assert.ok(r.calls.some((c) => c.tool === "ask_followup"));
  r = await say("that's all");
  assert.ok(r.calls.some((c) => c.tool === "capture_story") && r.saved);
  assert.equal((await st.all()).length, 4);

  r = await say("what did Rose say about her job?");
  assert.match(r.reply, /Kowalski/);
  r = await say("tell me about money from the first paycheck");
  assert.match(r.reply, /Kowalski|bakery/i);

  r = await say("quiz me on Dad's stories");
  assert.equal(r.mode, "quiz");
  r = await say("Yellowstone"); r = await say("1994"); r = await say("Eagle Creek");
  assert.match(r.reply, /out of 3/);
  const a = await fetch("http://127.0.0.1:3399/api/archive", { headers: { "x-household": "t" } }).then((x) => x.json());
  assert.ok(a.graph.nodes.length > 4 && a.timeline[0].year);
});

test("Bedrock tool-use agent loop (mocked model) calls MCP tools", async () => {
  let turn = 0;
  AI._setClient({ send: async () => {
    turn++;
    if (turn === 1) return { output: { message: { role: "assistant", content: [{ toolUse: { toolUseId: "1", name: "retrieve_memory", input: { query: "bakery" } } }] } } };
    return { output: { message: { role: "assistant", content: [{ text: "She started at the bakery in 1958." }] } } };
  } });
  process.env.BEDROCK_MODEL_ID = "mock";
  const r = await say("what about the bakery?", "agent");
  delete process.env.BEDROCK_MODEL_ID;
  assert.equal(r.engine, "bedrock-agent");
  assert.equal(r.calls[0].tool, "retrieve_memory");
  assert.match(r.reply, /bakery/);
});

const sayL = (utterance, lang, session) => fetch("http://127.0.0.1:3399/api/say", { method: "POST", headers: { "content-type": "application/json", "x-household": "ml" }, body: JSON.stringify({ session, utterance, teller: "Maya", lang }) }).then((r) => r.json());

test("seven languages: retrieval, interview, quiz, switching", async () => {
  const { seedHousehold } = await import("../src/seed.mjs");
  await seedHousehold("ml");
  let r = await sayL("¿qué dijo Abuela Carmen sobre la feria?", "es", "es1");
  assert.match(r.reply, /Pedro/);
  r = await sayL("Qu'est-ce que Mamie Colette a dit sur le pain ?", "fr", "fr1");
  assert.match(r.reply, /pain/);
  r = await sayL("奶奶王梅说过什么关于第一份工作", "zh", "zh1");
  assert.match(r.reply, /纺织厂/);
  r = await sayL("o que a Vovó Lúcia contou sobre o Rio", "pt", "pt1");
  assert.match(r.reply, /Rio/);
  r = await sayL("was hat Oma Greta über Weihnachten gesagt", "de", "de1");
  assert.match(r.reply, /Hamburg/);
  r = await sayL("दादी सरला ने शादी के बारे में क्या कहा", "hi", "hi1");
  assert.match(r.reply, /जयपुर/);

  // switch language by voice, then interview in French
  r = await sayL("parle français", "en", "sw");
  assert.equal(r.lang, "fr");
  r = await sayL("Je veux vous raconter une histoire", "fr", "sw");
  assert.equal(r.mode, "story");
  r = await sayL("En 1990 j'étais à Paris avec ma sœur Anne et j'étais très heureuse.", "fr", "sw");
  assert.ok(r.reply.length > 20 && /\?/.test(r.reply));
  r = await sayL("c'est tout", "fr", "sw");
  assert.ok(r.saved && /Merci/.test(r.reply));

  // storytelling offers another
  r = await sayL("what did Grandma Rose say about Dayton", "en", "off");
  assert.match(r.reply, /another one/);
  r = await sayL("yes please", "en", "off");
  assert.ok(r.story);
});

test("kitchen script works end to end in all seven languages", async () => {
  const { seedHousehold } = await import("../src/seed.mjs");
  const { SCRIPT } = await import("../public/kitchen-script.js");
  const key = { en: "Kowalski", es: "Kowalski", fr: "Kowalski", zh: "面包店", pt: "Kowalski", de: "Kowalski", hi: "कोवाल्स्की" };
  for (const lang of Object.keys(SCRIPT)) {
    const h = "kit-" + lang, sc = SCRIPT[lang];
    await seedHousehold(h, lang === "en" ? "" : lang);
    const say = (utterance, teller) => fetch("http://127.0.0.1:3399/api/say", { method: "POST", headers: { "content-type": "application/json", "x-household": h }, body: JSON.stringify({ session: "k", utterance, teller, lang }) }).then((r) => r.json());
    let r = await say(sc.tell, "Grandma Rose"); assert.equal(r.mode, "story", lang + " tell");
    r = await say(sc.p1, "Grandma Rose"); assert.equal(r.mode, "story", lang + " p1"); assert.ok(r.reply.length > 10);
    r = await say(sc.p2, "Grandma Rose"); assert.equal(r.mode, "story", lang + " p2");
    r = await say(sc.done, "Grandma Rose"); assert.ok(r.saved, lang + " saved");
    r = await say(sc.ask, "Maya"); assert.ok(r.reply.includes(key[lang]), `${lang} ask -> ${r.reply.slice(0, 80)}`);
    r = await say(sc.quiz, "Maya"); assert.equal(r.mode, "quiz", lang + " quiz");
    const qs = r.calls.find((c) => c.tool === "generate_quiz").result.questions;
    for (let i = 0; i < qs.length; i++) r = await say(qs[i].answer, "Maya");
    assert.ok(!r.mode || r.mode === "idle", lang + " quiz finished");
    r = await say(sc.thanks, "Maya"); assert.ok(r.reply.length > 5);
  }
});

test("speaker recognition flow, family time and messages for the future", async () => {
  const { seedHousehold } = await import("../src/seed.mjs");
  await seedHousehold("fam");
  const say = (utterance, o = {}) => fetch("http://127.0.0.1:3399/api/say", { method: "POST", headers: { "content-type": "application/json", "x-household": "fam" }, body: JSON.stringify({ session: o.s || "f", utterance, teller: "Guest", lang: o.lang || "en", speaker: o.speaker }) }).then((r) => r.json());

  // "Hey Hearth" (wake word only) + the device's voice guess -> "that sounds like Victor"
  let r = await say("", { speaker: { name: "Victor Hayes", score: 0.82 } });
  assert.match(r.reply, /sounds like Victor Hayes/); assert.equal(r.mode, "confirm");
  r = await say("yes");
  assert.match(r.reply, /Victor Hayes/); assert.equal(r.teller, "Victor Hayes");
  // wrong guess -> asks who, learns the name
  r = await say("", { s: "g", speaker: { name: "Ada", score: 0.8 } }); assert.match(r.reply, /sounds like Ada/);
  r = await say("no", { s: "g" }); assert.match(r.reply, /Who is this/);
  r = await say("it's Tunde", { s: "g" }); assert.equal(r.teller, "Tunde");
  // confident guess while talking: no interruption, teller silently updated
  r = await say("who has shared stories?", { s: "h", speaker: { name: "Maya", score: 0.9 } }); assert.equal(r.teller, "Maya"); assert.match(r.reply, /archive/);

  // family time: names, then questions rotate between players, scoreboard at the end
  r = await say("let's have family time", { s: "ft" }); assert.equal(r.mode, "family"); assert.match(r.reply, /Family time/);
  r = await say("Victor, Ada and Tunde", { s: "ft" }); assert.match(r.reply, /Victor, your question/);
  const qs = r.calls.find((c) => c.tool === "generate_quiz").result.questions;
  const players = ["Victor", "Ada", "Tunde"], seen = [];
  for (let i = 0; i < qs.length; i++) { r = await say(i === 1 ? "no idea" : qs[i].answer, { s: "ft" }); seen.push(r.reply); }
  assert.ok(seen.slice(0, -1).every((t, i) => t.includes(players[(i + 1) % 3])), "turns rotate");
  assert.match(seen.at(-1), /Victor, \d|Ada, \d|Tunde, \d/); assert.ok(!r.mode || r.mode === "idle");

  // message for future generations is stored under the right title, without being interviewed
  r = await say("I want to leave a message for my grandchildren", { s: "leg" }); assert.equal(r.mode, "story"); assert.match(r.reply, /come after you/);
  r = await say("Be kind, work hard and always call your mother.", { s: "leg" }); assert.ok(!/\?/.test(r.reply));
  r = await say("that's all", { s: "leg" }); assert.ok(r.saved);
  const arch = await (await fetch("http://127.0.0.1:3399/api/archive", { headers: { "x-household": "fam" } })).json();
  assert.ok(arch.memories.some((m) => m.title === "A message for the future"));

  // the same features in other languages
  for (const [lang, fam, names, who] of [["es", "hora en familia", "Victor, Ada y Tunde", /Victor, tu pregunta/], ["zh", "家庭时间", "Victor、Ada和Tunde", /Victor，你的问题/], ["hi", "पारिवारिक समय", "Victor, Ada और Tunde", /Victor, आपका सवाल/], ["fr", "heure en famille", "Victor, Ada et Tunde", /Victor, votre question/]]) {
    await seedHousehold("fam", ""); 
    let x = await say(fam, { lang, s: "ft-" + lang }); assert.equal(x.mode, "family", lang);
    x = await say(names, { lang, s: "ft-" + lang }); assert.match(x.reply, who, lang);
  }
});
