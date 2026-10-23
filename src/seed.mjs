// Fictional demo family. Run: npm run seed [household]
import { forHousehold } from "./store.mjs";
import { newMemory } from "./nlp.mjs";
import { ROSE, NG } from "./seed-i18n.mjs";
export const STORIES = [
  ["Grandma Rose", "The day Walter asked me to dance", "In the summer of 1962 I went to a dance at the Grange Hall in Dayton with my sister Ruth. I was nervous because I had sewn my own dress the night before. Walter walked straight across the floor and asked me to dance, and I laughed so hard I stepped on his foot. We were married two years later and I still remember the smell of his aftershave."],
  ["Grandma Rose", "My first job at the bakery", "In 1958 I got my first job at Kowalski Bakery in Dayton. I was sixteen and so proud of my first paycheck, which was eleven dollars. Mr. Kowalski taught me to braid challah before sunrise, and I used to bring the broken loaves home to my brother Tom."],
  ["Grandma Rose", "The winter the river froze", "In the winter of 1963 the river froze solid in Dayton and the whole town skated on it. Walter pushed me across the ice in a kitchen chair and we laughed until it was dark. I was so happy that night I cried on the walk home."],
  ["Dad", "The night we got lost in Yellowstone", "In 1994 we drove to Yellowstone with Uncle Frank. We got lost after dark near Lake Hotel and I was scared, but Maya laughed the whole way. Frank sang old songs until we found the road again, and I still remember how happy everyone felt at the diner afterwards."],
  ["Dad", "Learning to fish with Grandpa Walter", "Back in the seventies, my father Walter took me fishing at Eagle Creek every Saturday. I remember the cold thermos of cocoa and how proud he was when I caught my first trout. He never said much, but he loved those mornings."],
  ["Dad", "The first house on Maple Street", "In 1989 Mom and I bought our first house on Maple Street in Columbus. The porch was falling apart and I was worried we had made a mistake, but your grandfather Walter showed up that weekend with a truck full of tools and fixed every step."],
  ["Maya", "My graduation speech", "In 2019 I gave the graduation speech at Westfield High. I was terrified, but I looked at Grandma Rose in the third row and remembered what she told me about being brave. I was so proud when she stood first."],
  // Stories told in other languages (the archive is multilingual)
  ["Abuela Carmen", "El día que conocí a Pedro", "En 1971 conocí a Pedro en la plaza de Sevilla durante la feria. Yo estaba nerviosa y feliz, y él me regaló una flor roja. Nos casamos un año después y todavía guardo esa flor.", "es"],
  ["Mamie Colette", "Le pain de ma grand-mère", "En 1965, dans la cuisine de ma grand-mère à Lyon, j'ai appris à faire le pain. Je me souviens de l'odeur du four et j'étais si fière de mon premier pain.", "fr"],
  ["奶奶王梅", "我的第一份工作", "1975年，我在上海的一家纺织厂找到了第一份工作。我很开心，也有点紧张。师傅教我织布，我把第一个月的工资全部交给了妈妈。", "zh"],
  ["Vovó Lúcia", "A viagem para o Rio", "Em 1982 viajei de ônibus para o Rio de Janeiro com a minha irmã Marta. Eu estava com medo, mas fiquei muito feliz quando vi o mar pela primeira vez.", "pt"],
  ["Oma Greta", "Weihnachten in Hamburg", "Im Winter 1958 feierten wir Weihnachten in Hamburg bei meinem Bruder Karl. Ich erinnere mich an den Duft von Tannen und Zimt, und ich war so glücklich, dass alle zusammen waren.", "de"],
  ["दादी सरला", "हमारी शादी का दिन", "1967 में जयपुर में मेरी शादी हुई थी। मैं बहुत घबराई हुई थी लेकिन ख़ुश भी थी। मेरे पिता ने मुझे अपनी माँ की चूड़ियाँ दीं, जो मुझे आज भी याद हैं।", "hi"],
];
export async function seedHousehold(household, only) {
  const store = forHousehold(household);
  await store.clear();
  if (only === "ng") { for (const [teller, title, text] of NG) await store.add(newMemory({ teller, title, text, lang: "en", source: "seed" })); return NG.length; }
  if (only && ROSE[only]) { for (const [title, text] of ROSE[only]) await store.add(newMemory({ teller: "Grandma Rose", title, text, lang: only, source: "seed" })); return ROSE[only].length; }
  for (const [teller, title, text, lang] of STORIES) await store.add(newMemory({ teller, title, text, lang: lang || "en", source: "seed" }));
  return STORIES.length;
}

import { fileURLToPath } from "node:url";
if (process.argv[1] === fileURLToPath(import.meta.url)) console.log("Seeded", await seedHousehold(process.argv[2] || "home", process.argv[3] || ""), "stories");
