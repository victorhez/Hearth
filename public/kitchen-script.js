// The kitchen scene, in all seven languages. Each line is what the character SAYS (and sends to Hearth).
// Wording is chosen so Hearth's local intent patterns understand it; with Bedrock any phrasing works.
export const SCRIPT = {
  en: {
    ui: { cap1: "SUNDAY MORNING · GRANDMA ROSE REMEMBERS", cap2: "LATER THAT EVENING", cap3: "THE KITCHEN · SUNDAY MORNING", play: "PLAY SCENE", sub: "A day in the kitchen · the voice that keeps your family's stories", note: "Voices are neural TTS · every reply is a real MCP tool call", live: "YOUR TURN · SPEAK TO HEARTH", end1: "Every family has stories worth keeping.", end2: "Hearth makes sure they are never lost." },
    tell: "Hey Hearth, I want to tell you about how Walter and I met.",
    p1: "It was the summer of 1962, at the Grange Hall in Dayton. I had sewn my own dress the night before, and I was so nervous.",
    p2: "Walter walked straight across the floor and asked me to dance. I laughed so hard I stepped on his foot. We were married two years later.",
    done: "That's all.", ask: "Hey Hearth, what did Grandma Rose say about her first job?", quiz: "Hey Hearth, quiz me on Grandma Rose's stories.", thanks: "Thank you, Hearth.",
  },
  es: {
    ui: { cap1: "DOMINGO POR LA MAÑANA · LA ABUELA ROSE RECUERDA", cap2: "ESA MISMA NOCHE", cap3: "LA COCINA · DOMINGO POR LA MAÑANA", play: "VER LA ESCENA", sub: "Un día en la cocina · la voz que guarda las historias de tu familia", note: "Voces neuronales · cada respuesta es una llamada real a herramientas MCP", live: "TU TURNO · HABLA CON HEARTH", end1: "Toda familia tiene historias que merecen guardarse.", end2: "Hearth se asegura de que nunca se pierdan." },
    tell: "Hey Hearth, quiero contarte cómo conocí a Walter.",
    p1: "Fue en el verano de 1962, en Dayton. Me había cosido el vestido la noche anterior y estaba muy nerviosa.",
    p2: "Walter cruzó la pista y me sacó a bailar. Me reí tanto que le pisé el pie. Nos casamos dos años después.",
    done: "Eso es todo.", ask: "Hey Hearth, ¿qué dijo la abuela Rose sobre su primer trabajo?", quiz: "Hey Hearth, hazme un cuestionario sobre las historias de Grandma Rose.", thanks: "Gracias, Hearth.",
  },
  fr: {
    ui: { cap1: "DIMANCHE MATIN · MAMIE ROSE SE SOUVIENT", cap2: "PLUS TARD DANS LA SOIRÉE", cap3: "LA CUISINE · DIMANCHE MATIN", play: "LANCER LA SCÈNE", sub: "Une journée dans la cuisine · la voix qui garde les histoires de votre famille", note: "Voix neuronales · chaque réponse est un vrai appel d'outils MCP", live: "À VOUS · PARLEZ À HEARTH", end1: "Chaque famille a des histoires qui méritent d'être gardées.", end2: "Hearth veille à ce qu'elles ne se perdent jamais." },
    tell: "Hey Hearth, je veux vous raconter comment j'ai rencontré Walter.",
    p1: "C'était pendant l'été 1962, à Dayton. J'avais cousu ma robe la veille et j'étais très nerveuse.",
    p2: "Walter a traversé la piste pour m'inviter à danser. J'ai tellement ri que je lui ai marché sur le pied. Nous nous sommes mariés deux ans plus tard.",
    done: "C'est tout.", ask: "Hey Hearth, qu'est-ce que Mamie Rose a dit sur son premier travail ?", quiz: "Hey Hearth, fais-moi un quiz sur les histoires de Grandma Rose.", thanks: "Merci, Hearth.",
  },
  zh: {
    ui: { cap1: "周日早晨 · 奶奶Rose的回忆", cap2: "当天傍晚", cap3: "厨房 · 周日早晨", play: "播放场景", sub: "厨房里的一天 · 守护你家故事的声音", note: "神经网络语音 · 每个回答都是真实的 MCP 工具调用", live: "轮到你了 · 和 Hearth 说话", end1: "每个家庭都有值得珍藏的故事。", end2: "Hearth 让它们永不丢失。" },
    tell: "Hey Hearth，我想给你讲讲我和沃尔特是怎么认识的。",
    p1: "那是1962年夏天，在代顿。我前一晚自己缝了裙子，心里特别紧张。",
    p2: "沃尔特穿过舞池来邀请我跳舞，我笑得踩到了他的脚。两年后我们结了婚。",
    done: "说完了。", ask: "Hey Hearth，奶奶Rose说过什么关于第一份工作", quiz: "Hey Hearth，考考我奶奶Rose的故事。", thanks: "谢谢你，Hearth。",
  },
  pt: {
    ui: { cap1: "DOMINGO DE MANHÃ · A VOVÓ ROSE RECORDA", cap2: "MAIS TARDE NAQUELA NOITE", cap3: "A COZINHA · DOMINGO DE MANHÃ", play: "VER A CENA", sub: "Um dia na cozinha · a voz que guarda as histórias da sua família", note: "Vozes neurais · cada resposta é uma chamada real de ferramentas MCP", live: "SUA VEZ · FALE COM A HEARTH", end1: "Toda família tem histórias que merecem ser guardadas.", end2: "A Hearth garante que elas nunca se percam." },
    tell: "Hey Hearth, quero te contar como conheci o Walter.",
    p1: "Foi no verão de 1962, em Dayton. Eu tinha costurado o meu vestido na noite anterior e estava muito nervosa.",
    p2: "O Walter atravessou o salão e me tirou para dançar. Eu ri tanto que pisei no pé dele. Casamos dois anos depois.",
    done: "É só isso.", ask: "Hey Hearth, o que a vovó Rose contou sobre o primeiro emprego?", quiz: "Hey Hearth, faça um quiz das histórias da Grandma Rose.", thanks: "Obrigada, Hearth.",
  },
  de: {
    ui: { cap1: "SONNTAGMORGEN · OMA ROSE ERINNERT SICH", cap2: "SPÄTER AM ABEND", cap3: "DIE KÜCHE · SONNTAGMORGEN", play: "SZENE ABSPIELEN", sub: "Ein Tag in der Küche · die Stimme, die die Geschichten deiner Familie bewahrt", note: "Neuronale Stimmen · jede Antwort ist ein echter MCP-Tool-Aufruf", live: "DU BIST DRAN · SPRICH MIT HEARTH", end1: "Jede Familie hat Geschichten, die es wert sind, bewahrt zu werden.", end2: "Hearth sorgt dafür, dass sie nie verloren gehen." },
    tell: "Hey Hearth, ich will dir erzählen, wie ich Walter kennengelernt habe.",
    p1: "Das war im Sommer 1962, in Dayton. Ich hatte mein Kleid am Abend zuvor genäht und war sehr nervös.",
    p2: "Walter kam quer durch den Saal und bat mich zum Tanz. Ich lachte so sehr, dass ich ihm auf den Fuß trat. Zwei Jahre später heirateten wir.",
    done: "Das war's.", ask: "Hey Hearth, was hat Oma Rose über ihren ersten Job gesagt?", quiz: "Hey Hearth, mach ein Quiz über Roses Geschichten.", thanks: "Danke, Hearth.",
  },
  hi: {
    ui: { cap1: "रविवार की सुबह · दादी Rose की यादें", cap2: "उसी शाम", cap3: "रसोई · रविवार की सुबह", play: "दृश्य चलाएँ", sub: "रसोई में एक दिन · वह आवाज़ जो आपके परिवार की कहानियाँ सँजोती है", note: "न्यूरल आवाज़ें · हर जवाब एक असली MCP टूल कॉल है", live: "आपकी बारी · Hearth से बात करें", end1: "हर परिवार के पास सहेजने लायक कहानियाँ होती हैं।", end2: "Hearth यह सुनिश्चित करता है कि वे कभी खो न जाएँ।" },
    tell: "Hey Hearth, मैं आपको बताना चाहता हूँ कि मैं वॉल्टर से कैसे मिली।",
    p1: "यह 1962 की गर्मियों की बात है, मैं डेटन पहुँची थी। मैंने पिछली रात अपनी पोशाक खुद सिली थी और मैं बहुत घबराई हुई थी।",
    p2: "वॉल्टर ने मुझे नाचने के लिए बुलाया। मैं इतना हँसी कि उसका पैर कुचल दिया। दो साल बाद हमारी शादी हो गई।",
    done: "बस इतना ही।", ask: "Hey Hearth, दादी Rose ने पहली नौकरी के बारे में क्या कहा?", quiz: "Hey Hearth, Grandma Rose की कहानियों से मेरा क्विज़ लो।", thanks: "धन्यवाद, Hearth।",
  },
};
