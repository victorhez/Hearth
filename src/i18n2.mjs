// Strings and intents for: speaker recognition ("that sounds like Victor"), voice enrolment, family time (a guided
// family game built from the archive), and messages for future generations. Merged into S / INTENT from i18n.mjs.
import { S, INTENT } from "./i18n.mjs";

const EXTRA = {
  en: {
    sp: { sounds: (n) => `Okay, that sounds like ${n}. Is that right?`, hello: (n) => `Lovely to hear you, ${n}.`, who: "Sorry about that! Who is this?" },
    enroll: { askName: "Sure. What's your name?", sample: "Nice to meet you. Now just talk to me naturally for a few seconds. Tell me what you had for dinner.", done: (n) => `Got it. From now on I'll know ${n} by voice.` },
    ft: { ask: "Family time! Who's playing today? Say your names.", start: (names) => `Lovely: ${names}. Let's begin.`, turn: (n, q, c) => `${n}, your question: ${q} Is it ${c}?`, next: (f, n, q, c) => `${f} ${n}, your turn: ${q} Is it ${c}?`, score: (n, s) => `${n}, ${s}`, end: (sc, w) => `${sc}. ${w}`, win: (n) => `${n} wins! You've all been listening, and that is the real prize.`, tie: "It's a tie! You've all been listening, and that is the real prize.", sep: ", " },
    legacy: { title: "A message for the future", start: (n) => `Of course, ${n}. Speak to the people who will come after you, as if they were sitting right here. Say "that's all" when you're done.` },
  },
  es: {
    sp: { sounds: (n) => `Vale, suena a ${n}. ¿Es correcto?`, hello: (n) => `Qué gusto oírte, ${n}.`, who: "¡Perdona! ¿Quién eres?" },
    enroll: { askName: "Claro. ¿Cómo te llamas?", sample: "Mucho gusto. Ahora habla conmigo con naturalidad unos segundos. Cuéntame qué cenaste.", done: (n) => `Listo. A partir de ahora reconoceré la voz de ${n}.` },
    ft: { ask: "¡Hora en familia! ¿Quién juega hoy? Decid vuestros nombres.", start: (names) => `Genial: ${names}. Empecemos.`, turn: (n, q, c) => `${n}, tu pregunta: ${q} ¿Es ${c}?`, next: (f, n, q, c) => `${f} ${n}, te toca: ${q} ¿Es ${c}?`, score: (n, s) => `${n}, ${s}`, end: (sc, w) => `${sc}. ${w}`, win: (n) => `¡Gana ${n}! Todos habéis escuchado, y ese es el verdadero premio.`, tie: "¡Empate! Todos habéis escuchado, y ese es el verdadero premio.", sep: ", " },
    legacy: { title: "Un mensaje para el futuro", start: (n) => `Por supuesto, ${n}. Habla a quienes vendrán después de ti, como si estuvieran aquí contigo. Di "eso es todo" cuando termines.` },
  },
  fr: {
    sp: { sounds: (n) => `D'accord, on dirait ${n}. C'est bien ça ?`, hello: (n) => `Quel plaisir de vous entendre, ${n}.`, who: "Désolé ! Qui est-ce ?" },
    enroll: { askName: "Bien sûr. Comment vous appelez-vous ?", sample: "Enchanté. Parlez-moi maintenant naturellement quelques secondes. Racontez-moi ce que vous avez mangé hier soir.", done: (n) => `C'est noté. Désormais, je reconnaîtrai la voix de ${n}.` },
    ft: { ask: "C'est l'heure de la famille ! Qui joue aujourd'hui ? Dites vos prénoms.", start: (names) => `Super : ${names}. Commençons.`, turn: (n, q, c) => `${n}, votre question : ${q} Est-ce ${c} ?`, next: (f, n, q, c) => `${f} ${n}, à vous : ${q} Est-ce ${c} ?`, score: (n, s) => `${n}, ${s}`, end: (sc, w) => `${sc}. ${w}`, win: (n) => `${n} gagne ! Vous avez tous bien écouté, et c'est le vrai prix.`, tie: "Égalité ! Vous avez tous bien écouté, et c'est le vrai prix.", sep: ", " },
    legacy: { title: "Un message pour l'avenir", start: (n) => `Bien sûr, ${n}. Parlez à ceux qui viendront après vous, comme s'ils étaient là. Dites « c'est tout » quand vous avez fini.` },
  },
  zh: {
    sp: { sounds: (n) => `好的，听起来像是${n}。对吗？`, hello: (n) => `很高兴听到你，${n}。`, who: "抱歉！请问你是谁？" },
    enroll: { askName: "好的。你叫什么名字？", sample: "很高兴认识你。现在请自然地和我说几秒钟的话，比如告诉我你昨晚吃了什么。", done: (n) => `好了。以后我会通过声音认出${n}。` },
    ft: { ask: "家庭时间！今天谁来玩？请说出你们的名字。", start: (names) => `太好了：${names}。我们开始吧。`, turn: (n, q, c) => `${n}，你的问题：${q} 是${c}？`, next: (f, n, q, c) => `${f} ${n}，轮到你了：${q} 是${c}？`, score: (n, s) => `${n}，${s}分`, end: (sc, w) => `${sc}。${w}`, win: (n) => `${n}获胜！你们都听得很认真，这才是真正的奖励。`, tie: "平局！你们都听得很认真，这才是真正的奖励。", sep: "，" },
    legacy: { title: "给未来的一段话", start: (n) => `当然，${n}。请对将来的人说话，就像他们坐在你面前一样。说完了就告诉我“说完了”。` },
  },
  pt: {
    sp: { sounds: (n) => `Certo, parece ser ${n}. Está certo?`, hello: (n) => `Que bom ouvir você, ${n}.`, who: "Desculpe! Quem é?" },
    enroll: { askName: "Claro. Qual é o seu nome?", sample: "Prazer em conhecer. Agora fale comigo naturalmente por alguns segundos. Conte o que você jantou.", done: (n) => `Pronto. A partir de agora vou reconhecer a voz de ${n}.` },
    ft: { ask: "Hora da família! Quem vai jogar hoje? Digam os seus nomes.", start: (names) => `Ótimo: ${names}. Vamos começar.`, turn: (n, q, c) => `${n}, sua pergunta: ${q} É ${c}?`, next: (f, n, q, c) => `${f} ${n}, sua vez: ${q} É ${c}?`, score: (n, s) => `${n}, ${s}`, end: (sc, w) => `${sc}. ${w}`, win: (n) => `${n} venceu! Vocês todos estiveram ouvindo, e esse é o verdadeiro prêmio.`, tie: "Empate! Vocês todos estiveram ouvindo, e esse é o verdadeiro prêmio.", sep: ", " },
    legacy: { title: "Uma mensagem para o futuro", start: (n) => `Claro, ${n}. Fale para as pessoas que virão depois de você, como se estivessem aqui. Diga "é só isso" quando terminar.` },
  },
  de: {
    sp: { sounds: (n) => `Okay, das klingt nach ${n}. Stimmt das?`, hello: (n) => `Schön, dich zu hören, ${n}.`, who: "Entschuldige! Wer spricht da?" },
    enroll: { askName: "Gern. Wie heißt du?", sample: "Freut mich. Sprich jetzt ein paar Sekunden ganz natürlich mit mir. Erzähl mir, was du zu Abend gegessen hast.", done: (n) => `Alles klar. Ab jetzt erkenne ich ${n} an der Stimme.` },
    ft: { ask: "Familienzeit! Wer spielt heute mit? Sagt eure Namen.", start: (names) => `Schön: ${names}. Los geht's.`, turn: (n, q, c) => `${n}, deine Frage: ${q} Ist es ${c}?`, next: (f, n, q, c) => `${f} ${n}, du bist dran: ${q} Ist es ${c}?`, score: (n, s) => `${n}, ${s}`, end: (sc, w) => `${sc}. ${w}`, win: (n) => `${n} gewinnt! Ihr habt alle gut zugehört, und das ist der eigentliche Preis.`, tie: "Unentschieden! Ihr habt alle gut zugehört, und das ist der eigentliche Preis.", sep: ", " },
    legacy: { title: "Eine Botschaft für die Zukunft", start: (n) => `Natürlich, ${n}. Sprich zu den Menschen, die nach dir kommen, als würden sie neben dir sitzen. Sag „das war's“, wenn du fertig bist.` },
  },
  hi: {
    sp: { sounds: (n) => `ठीक है, यह ${n} की आवाज़ लगती है। क्या यह सही है?`, hello: (n) => `आपको सुनकर अच्छा लगा, ${n}।`, who: "माफ़ कीजिए! आप कौन हैं?" },
    enroll: { askName: "ज़रूर। आपका नाम क्या है?", sample: "आपसे मिलकर अच्छा लगा। अब कुछ सेकंड मुझसे सहज होकर बात कीजिए। बताइए कि आपने रात के खाने में क्या खाया।", done: (n) => `ठीक है। अब से मैं ${n} की आवाज़ पहचान लूँगा।` },
    ft: { ask: "पारिवारिक समय! आज कौन खेल रहा है? अपने नाम बताइए।", start: (names) => `बढ़िया: ${names}। चलिए शुरू करें।`, turn: (n, q, c) => `${n}, आपका सवाल: ${q} क्या यह ${c}?`, next: (f, n, q, c) => `${f} ${n}, आपकी बारी: ${q} क्या यह ${c}?`, score: (n, s) => `${n}, ${s}`, end: (sc, w) => `${sc}। ${w}`, win: (n) => `${n} जीते! आप सबने ध्यान से सुना, और यही असली इनाम है।`, tie: "बराबरी! आप सबने ध्यान से सुना, और यही असली इनाम है।", sep: ", " },
    legacy: { title: "भविष्य के लिए एक संदेश", start: (n) => `ज़रूर, ${n}। उन लोगों से बात कीजिए जो आपके बाद आएँगे, जैसे वे यहीं बैठे हों। पूरा होने पर कहिए "बस इतना ही"।` },
  },
};

const INT = {
  en: { family: /(family time|game night|let'?s play|play a game)/, legacy: /(message for (my )?(grand\w*|future|children|kids|unborn)|leave (a )?message|future generations?)/, enroll: /(remember my voice|learn my voice|recogni[sz]e my voice)/ },
  es: { family: /(hora en familia|tiempo en familia|noche de juegos|vamos a jugar|juguemos)/, legacy: /(mensaje para (mis )?(nietos|hijos|el futuro)|dejar un mensaje|futuras generaciones)/, enroll: /(recuerda mi voz|aprende mi voz|reconoce mi voz)/ },
  fr: { family: /(heure en famille|temps en famille|soirée jeux|jouons|jouer ensemble)/, legacy: /(message pour (mes )?(petits-enfants|enfants|l'avenir)|laisser un message|générations futures)/, enroll: /(retiens ma voix|apprends ma voix|reconnais ma voix)/ },
  zh: { family: /(家庭时间|亲子时间|家庭游戏|玩游戏|一起玩)/, legacy: /(给(我的)?(孙子|孙女|孩子|后代|未来).*(留言|信息|话)|留一段话|留言给)/, enroll: /(记住我的声音|认识我的声音|识别我的声音)/ },
  pt: { family: /(hora da família|tempo em família|noite de jogos|vamos jogar|jogar juntos)/, legacy: /(mensagem para (os )?(meus )?(netos|filhos|futuro)|deixar uma mensagem|futuras gerações)/, enroll: /(lembre da minha voz|lembre-se da minha voz|aprenda minha voz|reconheça minha voz)/ },
  de: { family: /(familienzeit|familienspiel|spielabend|lass uns spielen|spielen wir)/, legacy: /(botschaft für (meine )?(enkel|kinder|zukunft)|nachricht hinterlassen|zukünftige generationen)/, enroll: /(merk dir meine stimme|lerne meine stimme|erkenne meine stimme)/ },
  hi: { family: /(पारिवारिक समय|परिवार का समय|खेल का समय|खेलते हैं|चलो खेलें)/, legacy: /((पोते|पोती|बच्चों|भविष्य).*संदेश|संदेश छोड़|आने वाली पीढ़ी)/, enroll: /(मेरी आवाज़ याद|मेरी आवाज पहचान|मेरी आवाज़ पहचान)/ },
};

for (const l of Object.keys(EXTRA)) { Object.assign(S[l], EXTRA[l]); Object.assign(INTENT[l], INT[l]); }

// "Victor, Ada and Tunde" -> ["Victor", "Ada", "Tunde"]
export function parseNames(text, lang = "en") {
  const lead = /^(?:it'?s|we are|we're|i am|i'm|this is|playing|soy|somos|je suis|nous sommes|我是|我们是|ich bin|wir sind|eu sou|nós somos|मैं|हम)\s+/i;
  return text.replace(lead, "").split(/\s*(?:,|、|，|&|\band\b|\by\b|\bet\b|\be\b|\bund\b|和|और)\s*/i)
    .map((n) => n.replace(/[.!?。！？]+$/g, "").trim()).filter((n) => n && n.split(/\s+/).length <= 3 && n.length <= 30).slice(0, 8);
}
