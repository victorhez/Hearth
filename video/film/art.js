// Vector art for the film: a Nigerian family kitchen, five characters, the Ankara-wrapped Hearth device with its
// Raspberry Pi cutaway, and a phone. All drawn in SVG so every frame can be rendered deterministically.

export const SKIN = { papa: "#5a3727", grandma: "#6a4331", tunde: "#6e4630", chioma: "#7a4f37", mireille: "#4a2e21" };

export const DEFS = `
<defs>
  <linearGradient id="wallG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9a441"/><stop offset=".55" stop-color="#e8bf62"/><stop offset="1" stop-color="#f0cf86"/></linearGradient>
  <linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b3a67"/><stop offset=".45" stop-color="#e07a5f"/><stop offset="1" stop-color="#f6c177"/></linearGradient>
  <linearGradient id="floorG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a4b32"/><stop offset="1" stop-color="#4a2c1d"/></linearGradient>
  <linearGradient id="counterTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9a77a"/><stop offset="1" stop-color="#a98557"/></linearGradient>
  <linearGradient id="cab" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f6f5e"/><stop offset="1" stop-color="#1f4d41"/></linearGradient>
  <linearGradient id="steel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9aa3ad"/><stop offset=".5" stop-color="#e6ebef"/><stop offset="1" stop-color="#8b949e"/></linearGradient>
  <radialGradient id="lampGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd48a" stop-opacity=".85"/><stop offset="1" stop-color="#ffd48a" stop-opacity="0"/></radialGradient>
  <radialGradient id="vig" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14"/></filter>
  <filter id="blurBg"><feGaussianBlur stdDeviation="2.2"/></filter>
  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <!-- Ankara prints -->
  <pattern id="ankA" width="64" height="64" patternUnits="userSpaceOnUse"><rect width="64" height="64" fill="#1d4e89"/><circle cx="32" cy="32" r="22" fill="#f4a261"/><circle cx="32" cy="32" r="14" fill="#1d4e89"/><circle cx="32" cy="32" r="7" fill="#e9c46a"/><circle cx="0" cy="0" r="12" fill="#e76f51"/><circle cx="64" cy="0" r="12" fill="#e76f51"/><circle cx="0" cy="64" r="12" fill="#e76f51"/><circle cx="64" cy="64" r="12" fill="#e76f51"/></pattern>
  <pattern id="ankB" width="56" height="56" patternUnits="userSpaceOnUse"><rect width="56" height="56" fill="#2a9d8f"/><path d="M28 4L52 28L28 52L4 28Z" fill="#e9c46a"/><path d="M28 14L42 28L28 42L14 28Z" fill="#264653"/><circle cx="28" cy="28" r="5" fill="#f4a261"/></pattern>
  <pattern id="ankC" width="60" height="40" patternUnits="userSpaceOnUse"><rect width="60" height="40" fill="#b5179e"/><path d="M0 28L15 8L30 28L45 8L60 28" stroke="#ffd166" stroke-width="7" fill="none"/><path d="M0 40L15 20L30 40L45 20L60 40" stroke="#fff" stroke-width="3" fill="none"/></pattern>
  <pattern id="ankD" width="48" height="60" patternUnits="userSpaceOnUse"><rect width="48" height="60" fill="#e76f51"/><ellipse cx="24" cy="30" rx="18" ry="26" fill="#f4d35e"/><ellipse cx="24" cy="30" rx="11" ry="17" fill="#0b6e4f"/><ellipse cx="24" cy="30" rx="4" ry="7" fill="#fff"/><path d="M0 0L12 10M48 0L36 10M0 60L12 50M48 60L36 50" stroke="#264653" stroke-width="4"/></pattern>
  <pattern id="tile" width="60" height="60" patternUnits="userSpaceOnUse"><rect width="60" height="60" fill="#f4f1e8"/><rect x="2" y="2" width="56" height="56" fill="#fbfaf5"/></pattern>
  <pattern id="weave" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#8a5a2b"/><path d="M0 5H10M5 0V10" stroke="#c8944f" stroke-width="2.4"/></pattern>
  <pattern id="check" width="120" height="60" patternUnits="userSpaceOnUse"><rect width="120" height="60" fill="#8a5636"/><rect width="60" height="30" fill="#6e4328"/><rect x="60" y="30" width="60" height="30" fill="#6e4328"/></pattern>
  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" stroke="#1d3a5c" stroke-width="1" fill="none"/></pattern>
</defs>`;

// ------------------------------------------------------------------ the kitchen (back wall + furniture)
export const KITCHEN_BACK = `
<g id="kitchenBack">
  <rect width="1920" height="780" fill="url(#wallG)"/>
  <rect y="0" width="1920" height="90" fill="#a9772c" opacity=".35"/>
  <!-- tiled splashback -->
  <rect x="0" y="470" width="1920" height="170" fill="url(#tile)"/>
  <rect x="0" y="466" width="1920" height="8" fill="#c9a77a"/>
  <!-- window with burglar bars and a dusk sky -->
  <g transform="translate(70 120)">
    <rect x="-14" y="-14" width="388" height="388" rx="8" fill="#5b3a29"/>
    <rect width="360" height="360" fill="url(#dusk)"/>
    <g filter="url(#blurBg)"><path d="M0 270Q60 200 120 250T260 235T360 270V360H0Z" fill="#1f3a2b" opacity=".85"/>
      <rect x="30" y="170" width="44" height="100" fill="#3d2c24"/><path d="M52 90C10 100 -4 170 36 190C70 210 120 190 118 150C134 112 100 74 52 90Z" fill="#294c34"/>
      <rect x="260" y="205" width="70" height="60" fill="#6b4a3a"/><path d="M252 206L295 168L338 206Z" fill="#8c5a43"/></g>
    <g stroke="#2b1b14" stroke-width="7" fill="none"><path d="M90 0V360M180 0V360M270 0V360M0 120H360M0 240H360"/></g>
    <g stroke="#2b1b14" stroke-width="4" fill="none"><path d="M0 0L180 120L360 0M0 360L180 240L360 360"/></g>
    <rect width="360" height="360" fill="none" stroke="#2b1b14" stroke-width="10"/>
  </g>
  <path d="M70 470 L420 300 L560 440 L430 640 Z" fill="#ffd48a" opacity=".07"/>
  <!-- wall decor -->
  <g transform="translate(560 130)"><rect width="120" height="150" fill="#f7f0de" stroke="#6b4a2b" stroke-width="6"/><rect x="12" y="30" width="96" height="108" fill="#cfc4a8"/><circle cx="48" cy="72" r="14" fill="#7a6a58"/><circle cx="78" cy="78" r="12" fill="#7a6a58"/><path d="M20 138Q48 96 62 138" fill="#7a6a58"/><path d="M62 138Q82 100 100 138" fill="#7a6a58"/><rect x="12" y="8" width="96" height="16" fill="#e9dcc0"/><text x="60" y="21" font-size="10" text-anchor="middle" fill="#6b4a2b" font-family="Georgia">Lagos · 1987</text></g>
  <g id="clock" transform="translate(790 170)"><circle r="46" fill="#fff8e6" stroke="#5b3a29" stroke-width="7"/><path d="M0 0V-28M0 0L20 10" stroke="#3a2418" stroke-width="5" stroke-linecap="round"/></g>
  <g transform="translate(1010 120)"><rect width="150" height="190" fill="#fdf7e8" stroke="#8a5a2b" stroke-width="4"/><rect width="150" height="42" fill="#c0392b"/><text x="75" y="29" font-size="22" text-anchor="middle" fill="#fff" font-family="Arial" font-weight="700">DECEMBER</text><g font-family="Arial" font-size="15" fill="#444"><text x="22" y="80">1  2  3  4  5  6</text><text x="22" y="108">7  8  9 10 11 12</text><text x="22" y="136">13 14 15 16 17 18</text><text x="22" y="164">19 20 21 22 23 24</text></g><circle cx="118" cy="158" r="16" fill="none" stroke="#c0392b" stroke-width="3"/></g>
  <!-- shelf with enamel bowls, tins, calabash, bottles -->
  <g id="shelf" transform="translate(470 330)">
    <rect x="0" y="86" width="800" height="14" rx="4" fill="#5b3a29"/>
    <g><ellipse cx="60" cy="80" rx="46" ry="12" fill="#e8e1cf"/><path d="M14 80Q60 130 106 80Z" fill="#fff" stroke="#1d4e89" stroke-width="5"/><path d="M14 80H106" stroke="#1d4e89" stroke-width="5"/></g>
    <g transform="translate(140 0)"><rect y="30" width="58" height="56" rx="6" fill="#c0392b"/><rect y="42" width="58" height="22" fill="#f5e6c8"/><text x="29" y="58" font-size="14" text-anchor="middle" fill="#c0392b" font-family="Arial" font-weight="700">TOMATO</text></g>
    <g transform="translate(215 0)"><rect y="30" width="58" height="56" rx="6" fill="#2a9d8f"/><rect y="42" width="58" height="22" fill="#f5e6c8"/><text x="29" y="58" font-size="13" text-anchor="middle" fill="#2a9d8f" font-family="Arial" font-weight="700">SALT</text></g>
    <g transform="translate(300 0)"><path d="M0 86Q-10 30 40 24Q92 30 80 86Z" fill="#b97a3c"/><path d="M12 62Q40 40 68 62" stroke="#8a5a2b" stroke-width="4" fill="none"/><rect x="30" y="8" width="20" height="18" fill="#b97a3c"/></g>
    <g transform="translate(410 0)"><rect x="0" y="20" width="30" height="66" rx="8" fill="#a8321f"/><rect x="8" y="6" width="14" height="16" fill="#a8321f"/><rect x="38" y="34" width="26" height="52" rx="8" fill="#f2b705"/><rect x="43" y="22" width="16" height="14" fill="#f2b705"/><rect x="72" y="26" width="30" height="60" rx="8" fill="#f2b705" opacity=".9"/></g>
    <g transform="translate(560 0)"><ellipse cx="70" cy="80" rx="64" ry="14" fill="#cfd6da"/><path d="M6 80Q70 140 134 80Z" fill="#eef2f4" stroke="#7aa6c2" stroke-width="5"/></g>
    <g transform="translate(720 0)"><circle cx="30" cy="56" r="28" fill="#6aa84f"/><circle cx="52" cy="62" r="22" fill="#78b95b"/></g>
  </g>
  <!-- hanging ladles and pots -->
  <g transform="translate(1250 90)" stroke="#5b3a29" stroke-width="5" fill="none"><path d="M0 0V70M40 0V84M80 0V64"/><ellipse cx="0" cy="92" rx="18" ry="22" fill="#8a5a2b"/><ellipse cx="40" cy="104" rx="16" ry="20" fill="#8a5a2b"/><circle cx="80" cy="84" r="20" fill="#9aa3ad"/></g>
  <!-- ceiling lamp -->
  <g transform="translate(960 0)"><path d="M0 0V74" stroke="#2b1b14" stroke-width="4"/><path d="M-62 150Q0 40 62 150Z" fill="#d17a22"/><ellipse cx="0" cy="150" rx="62" ry="10" fill="#f7c76b"/></g>
  <ellipse cx="960" cy="360" rx="520" ry="360" fill="url(#lampGlow)" opacity=".7"/>
</g>`;

export const COUNTER = `
<g id="counter">
  <rect x="0" y="640" width="1920" height="26" fill="url(#counterTop)"/><rect x="0" y="666" width="1920" height="10" fill="#6b4a2b" opacity=".5"/>
  <rect x="0" y="676" width="1920" height="130" fill="url(#cab)"/>
  <g stroke="#173a31" stroke-width="4" fill="#27695a"><rect x="30" y="690" width="280" height="100" rx="6"/><rect x="340" y="690" width="280" height="100" rx="6"/><rect x="650" y="690" width="280" height="100" rx="6"/><rect x="960" y="690" width="280" height="100" rx="6"/><rect x="1270" y="690" width="280" height="100" rx="6"/><rect x="1580" y="690" width="290" height="100" rx="6"/></g>
  <g fill="#e9c46a"><circle cx="290" cy="740" r="7"/><circle cx="360" cy="740" r="7"/><circle cx="910" cy="740" r="7"/><circle cx="980" cy="740" r="7"/><circle cx="1530" cy="740" r="7"/><circle cx="1600" cy="740" r="7"/></g>
  <!-- gas cooker with a pot of jollof -->
  <g transform="translate(520 560)"><rect x="0" y="62" width="230" height="22" rx="6" fill="#d9dde1"/><rect x="14" y="40" width="202" height="26" rx="4" fill="#b8bec5"/><g fill="#2a2a2a"><circle cx="58" cy="52" r="15"/><circle cx="172" cy="52" r="15"/></g>
    <path d="M40 40H190L180 -22H50Z" fill="url(#steel)"/><ellipse cx="115" cy="-22" rx="65" ry="13" fill="#7c858e"/><ellipse cx="115" cy="-24" rx="55" ry="9" fill="#c0392b"/><path d="M42 6H18M188 6H212" stroke="#333" stroke-width="7" stroke-linecap="round"/><rect x="100" y="-38" width="30" height="8" rx="3" fill="#333"/></g>
  <!-- mortar and pestle, plantain -->
  <g transform="translate(1180 520)"><path d="M0 120Q-6 50 20 30H100Q126 50 120 120Z" fill="#8a5a2b"/><ellipse cx="60" cy="30" rx="40" ry="9" fill="#5b3a29"/><rect x="62" y="-30" width="18" height="72" rx="8" fill="#a67540" transform="rotate(14 70 0)"/></g>
  <g transform="translate(1340 560)"><path d="M0 80Q40 -20 130 20Q60 10 20 90Z" fill="#c8c04a"/><path d="M10 84Q60 0 140 40Q70 28 30 96Z" fill="#b5b83f"/><path d="M0 80L20 96" stroke="#5b3a29" stroke-width="8"/></g>
  <!-- a rack of enamel plates + a bowl of fruit -->
  <g transform="translate(1440 540)"><ellipse cx="60" cy="96" rx="64" ry="12" fill="#e9e3d0"/><circle cx="36" cy="76" r="22" fill="#e76f51"/><circle cx="72" cy="72" r="24" fill="#f4a261"/><circle cx="98" cy="80" r="18" fill="#7cb342"/></g>
</g>`;

export const FLOOR = `
<g id="floor"><rect y="806" width="1920" height="274" fill="url(#check)"/><rect y="806" width="1920" height="8" fill="#2a1a10" opacity=".5"/>
  <g transform="translate(1690 470)"><!-- standing fan -->
    <rect x="-8" y="140" width="16" height="190" fill="#444"/><ellipse cx="0" cy="330" rx="70" ry="12" fill="#333"/>
    <g id="fan"><circle r="104" fill="#ffffff" opacity=".18" stroke="#3a3a3a" stroke-width="5"/><g id="fanBlades" fill="#6c7a89" opacity=".9"><path d="M0 0C20-50 56-56 78-30C44-24 22-12 0 0Z"/><path d="M0 0C50 20 56 56 30 78C24 44 12 22 0 0Z" transform="rotate(0)"/><path d="M0 0C-20 50 -56 56 -78 30C-44 24 -22 12 0 0Z"/><path d="M0 0C-50-20 -56-56 -30-78C-24-44 -12-22 0 0Z"/></g><circle r="14" fill="#333"/></g></g>
  <g transform="translate(60 800)"><path d="M0 120Q-20 40 40 20Q110 10 120 120Z" fill="#b97a3c"/><g fill="#b5651d"><ellipse cx="30" cy="30" rx="26" ry="14"/><ellipse cx="66" cy="22" rx="28" ry="14"/><ellipse cx="94" cy="36" rx="22" ry="14"/></g></g>
</g>`;

export const TABLE = `
<g id="table">
  <rect x="-20" y="896" width="1960" height="40" rx="10" fill="#a56a3a"/><rect x="-20" y="936" width="1960" height="160" fill="#7a4a29"/><rect x="-20" y="936" width="1960" height="10" fill="#5b3a29" opacity=".6"/>
  <g transform="translate(878 838)"><ellipse cx="80" cy="56" rx="86" ry="14" fill="#f4f1e8"/><ellipse cx="80" cy="50" rx="74" ry="10" fill="#fff" stroke="#1d4e89" stroke-width="4"/><circle cx="52" cy="46" r="14" fill="#e76f51"/><circle cx="80" cy="42" r="16" fill="#f4a261"/><circle cx="108" cy="46" r="14" fill="#e76f51"/></g>
  <g transform="translate(1160 830) scale(.82)"><ellipse cx="90" cy="68" rx="96" ry="14" fill="#d94f30"/><path d="M0 62Q90 150 180 62Z" fill="#e76f51"/><ellipse cx="90" cy="62" rx="90" ry="12" fill="#e9a23a"/><g fill="#7a1f12"><circle cx="50" cy="62" r="6"/><circle cx="86" cy="58" r="6"/><circle cx="120" cy="62" r="6"/><circle cx="70" cy="68" r="5"/></g></g>
</g>`;

// ------------------------------------------------------------------ people
// Busts with separately animatable parts. `o` = { skin, top (css fill), hair: "short"|"gele"|"braids"|"bun"|"cap", glasses, ... }
export function person(id, o) {
  const skin = o.skin, dark = "#2a1a12";
  const hair = {
    short: `<path d="M-62 -86Q-56 -150 0 -154Q58 -150 62 -86Q40 -118 0 -118Q-38 -118 -62 -86Z" fill="${dark}"/>`,
    grey: `<path d="M-60 -84Q-54 -146 0 -150Q56 -146 60 -84Q38 -112 0 -112Q-36 -112 -60 -84Z" fill="#cfcfcf"/>`,
    gele: `<g><path d="M-78 -92Q-86 -176 -10 -196Q80 -190 82 -100Q40 -120 0 -120Q-40 -120 -78 -92Z" fill="#e9a23a"/><path d="M-70 -120Q-30 -176 20 -196Q-10 -150 -66 -112Z" fill="#c0392b"/><path d="M10 -196Q60 -222 96 -188Q60 -176 30 -186Z" fill="#f4d35e"/><path d="M-76 -96Q0 -130 80 -98" stroke="#fff4c8" stroke-width="5" fill="none" opacity=".7"/></g>`,
    braids: `<g><path d="M-64 -84Q-62 -152 0 -154Q62 -152 64 -84Q40 -118 0 -118Q-40 -118 -64 -84Z" fill="${dark}"/><g stroke="${dark}" stroke-width="14" stroke-linecap="round"><path d="M-64 -84L-76 -20M-46 -100L-62 -30M64 -84L76 -20M46 -100L62 -30"/></g><g fill="#f4d35e"><circle cx="-76" cy="-16" r="8"/><circle cx="-62" cy="-26" r="7"/><circle cx="76" cy="-16" r="8"/><circle cx="62" cy="-26" r="7"/></g></g>`,
    bun: `<g><path d="M-62 -86Q-56 -150 0 -154Q58 -150 62 -86Q40 -116 0 -116Q-38 -116 -62 -86Z" fill="${dark}"/><circle cx="0" cy="-168" r="26" fill="${dark}"/></g>`,
    cap: `<g><path d="M-62 -86Q-56 -150 0 -154Q58 -150 62 -86Q40 -112 0 -112Q-38 -112 -62 -86Z" fill="${dark}"/></g>`,
  }[o.hair] || "";
  const glasses = o.glasses ? `<g fill="none" stroke="#2a1a12" stroke-width="4"><circle cx="-26" cy="-70" r="17"/><circle cx="26" cy="-70" r="17"/><path d="M-9 -70H9"/></g>` : "";
  return `
<g id="${id}" class="person">
  <g class="pbody">
    <path d="M-120 200Q-130 70 -70 40Q0 22 70 40Q130 70 120 200Z" fill="${o.top}"/>
    ${o.collar || ""}
    <g id="${id}-armL"><path d="M-104 70Q-150 130 -120 200" stroke="${o.top}" stroke-width="34" stroke-linecap="round" fill="none"/><circle id="${id}-handL" cx="-120" cy="200" r="19" fill="${skin}"/></g>
    <g id="${id}-armR"><path d="M104 70Q150 130 120 200" stroke="${o.top}" stroke-width="34" stroke-linecap="round" fill="none"/><circle id="${id}-handR" cx="120" cy="200" r="19" fill="${skin}"/></g>
    <rect x="-22" y="-8" width="44" height="56" rx="16" fill="${skin}"/>
    <path d="M-30 30Q0 56 30 30" fill="#00000022"/>
  </g>
  <g class="phead" id="${id}-head">
    <ellipse cx="0" cy="-70" rx="64" ry="74" fill="${skin}"/>
    <ellipse cx="-66" cy="-66" rx="9" ry="16" fill="${skin}"/><ellipse cx="66" cy="-66" rx="9" ry="16" fill="${skin}"/>
    ${hair}
    <g id="${id}-eyes"><ellipse cx="-26" cy="-70" rx="9" ry="11" fill="#1a0f0a"/><ellipse cx="26" cy="-70" rx="9" ry="11" fill="#1a0f0a"/><circle cx="-23" cy="-74" r="3" fill="#fff"/><circle cx="29" cy="-74" r="3" fill="#fff"/></g>
    <g stroke="${dark}" stroke-width="5" stroke-linecap="round" fill="none" id="${id}-brows"><path d="M-40 -92Q-26 -100 -12 -92"/><path d="M12 -92Q26 -100 40 -92"/></g>
    ${glasses}
    <path d="M0 -62Q-7 -42 4 -40" stroke="#00000030" stroke-width="4" fill="none" stroke-linecap="round"/>
    <ellipse cx="-42" cy="-40" rx="12" ry="7" fill="#e07a5f" opacity=".28"/><ellipse cx="42" cy="-40" rx="12" ry="7" fill="#e07a5f" opacity=".28"/>
    <g id="${id}-mouth" transform="translate(0 -22)"><path id="${id}-mouthShape" d="M-20 -1Q0 -3 20 -1Q0 9 -20 -1Z" fill="#4a1a14"/></g>
  </g>
</g>`;
}

export const PEOPLE = {
  papa: { skin: SKIN.papa, top: "url(#ankB)", hair: "short", glasses: false },
  grandma: { skin: SKIN.grandma, top: "url(#ankC)", hair: "gele", glasses: true },
  tunde: { skin: SKIN.tunde, top: "#1b8a3c", hair: "cap", collar: `<path d="M-40 40L0 76L40 40" stroke="#fff" stroke-width="10" fill="none"/><path d="M-120 130H120" stroke="#fff" stroke-width="12" opacity=".8"/>` },
  chioma: { skin: SKIN.chioma, top: "url(#ankD)", hair: "braids" },
  mireille: { skin: SKIN.mireille, top: "#f2b705", hair: "bun", collar: `<path d="M-50 36Q0 70 50 36" stroke="#c98f00" stroke-width="9" fill="none"/>` },
};

// ------------------------------------------------------------------ the Hearth device (front view). Local origin: bottom centre.
export const DEVICE = `
<g id="device">
  <ellipse cx="0" cy="4" rx="80" ry="12" fill="#000" opacity=".28"/>
  <path d="M-62 0V-148Q-62 -176 0 -176Q62 -176 62 -148V0Q62 12 0 12Q-62 12 -62 0Z" fill="url(#ankD)"/>
  <path d="M-62 0V-148Q-62 -176 0 -176Q62 -176 62 -148V0Q62 12 0 12Q-62 12 -62 0Z" fill="#000" opacity=".12"/>
  <path d="M-62 -40H62M-62 -104H62" stroke="#3a2418" stroke-width="4" opacity=".6"/>
  <rect x="-62" y="-124" width="124" height="60" fill="url(#weave)" opacity=".95"/>
  <path d="M-62 -148Q-62 -176 0 -176Q62 -176 62 -148" fill="none" stroke="#2b1b14" stroke-width="3"/>
  <ellipse cx="0" cy="-168" rx="60" ry="14" fill="#2b2b33"/>
  <ellipse id="devRing" cx="0" cy="-168" rx="52" ry="11" fill="none" stroke="#f0b86a" stroke-width="8" filter="url(#glow)"/>
  <circle cx="-30" cy="-168" r="2.6" fill="#555"/><circle cx="30" cy="-168" r="2.6" fill="#555"/><circle cx="0" cy="-175" r="2.6" fill="#555"/>
</g>`;

// ------------------------------------------------------------------ exploded "what is inside" view (blueprint)
export const INSIDE = `
<g id="inside">
  <rect width="1920" height="1080" fill="#0c2340"/><rect width="1920" height="1080" fill="url(#grid)" opacity=".7"/>
  <g transform="translate(960 560)">
    <!-- outer shell, ghosted -->
    <g id="shell" opacity=".9"><path d="M-170 300V-300Q-170 -370 0 -370Q170 -370 170 -300V300Q170 330 0 330Q-170 330 -170 300Z" fill="url(#ankD)" opacity=".28" stroke="#7fb7ff" stroke-width="3" stroke-dasharray="10 8"/></g>
    <!-- LED ring + diffuser -->
    <g id="pLED" transform="translate(0 -300)"><ellipse rx="150" ry="34" fill="#1c1c24" stroke="#7fb7ff" stroke-width="3"/><ellipse id="inRing" rx="128" ry="26" fill="none" stroke="#f0b86a" stroke-width="12" filter="url(#glow)"/><g fill="#f4d35e"><circle cx="-128" cy="0" r="5"/><circle cx="-90" cy="-18" r="5"/><circle cx="-40" cy="-25" r="5"/><circle cx="40" cy="-25" r="5"/><circle cx="90" cy="-18" r="5"/><circle cx="128" cy="0" r="5"/></g></g>
    <!-- microphone array board -->
    <g id="pMIC" transform="translate(0 -170)"><ellipse rx="140" ry="30" fill="#0b6e4f" stroke="#7fe0b0" stroke-width="3"/><g fill="#1a1a1a" stroke="#999" stroke-width="2"><circle cx="-90" cy="0" r="10"/><circle cx="-30" cy="10" r="10"/><circle cx="30" cy="10" r="10"/><circle cx="90" cy="0" r="10"/></g><g fill="#c0c8cf"><rect x="-8" y="-12" width="16" height="10" rx="2"/></g></g>
    <!-- Raspberry Pi board -->
    <g id="pPI" transform="translate(0 20)">
      <rect x="-170" y="-60" width="340" height="150" rx="14" fill="#0e7a43" stroke="#7fe0b0" stroke-width="3"/>
      <rect x="-90" y="-30" width="74" height="74" rx="6" fill="#bfc7ce" stroke="#6a7680" stroke-width="2"/><rect x="-74" y="-14" width="42" height="42" fill="#7a848d"/>
      <rect x="-4" y="-30" width="62" height="44" rx="4" fill="#1d1d22"/><rect x="70" y="-36" width="40" height="30" rx="3" fill="#2b2b33"/>
      <g fill="#d9b44a"><rect x="-150" y="-52" width="150" height="14"/></g><g fill="#111"><g id="gpio"></g></g>
      <rect x="120" y="-48" width="52" height="62" rx="3" fill="#aab4bd" stroke="#6a7680" stroke-width="2"/><rect x="120" y="22" width="52" height="62" rx="3" fill="#aab4bd" stroke="#6a7680" stroke-width="2"/>
      <rect x="-172" y="10" width="46" height="34" rx="3" fill="#8e99a3"/><rect x="-172" y="52" width="46" height="30" rx="3" fill="#8e99a3"/>
      <rect x="40" y="58" width="52" height="26" rx="3" fill="#d6dbe0"/>
      <g fill="#e9e9e9"><circle cx="-150" cy="-44" r="3"/><circle cx="-134" cy="-44" r="3"/><circle cx="-118" cy="-44" r="3"/><circle cx="-102" cy="-44" r="3"/><circle cx="-86" cy="-44" r="3"/><circle cx="-70" cy="-44" r="3"/><circle cx="-54" cy="-44" r="3"/><circle cx="-38" cy="-44" r="3"/><circle cx="-22" cy="-44" r="3"/><circle cx="-6" cy="-44" r="3"/></g>
    </g>
    <!-- speaker driver -->
    <g id="pSPK" transform="translate(0 220)"><ellipse rx="140" ry="40" fill="#222" stroke="#7fb7ff" stroke-width="3"/><ellipse rx="100" ry="26" fill="#343b44"/><ellipse rx="48" ry="12" fill="#12151a"/><ellipse rx="140" ry="40" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="3 6" opacity=".4"/></g>
    <!-- connectors -->
    <g stroke="#7fb7ff" stroke-width="3" stroke-dasharray="6 6" fill="none" opacity=".7"><path d="M0 -266V-200M0 -140V-60M0 90V180"/></g>
  </g>
  <!-- callouts -->
  <g id="callouts" font-family="Segoe UI, Arial" fill="#e8f1ff">
    <g id="cLED" opacity="0"><path d="M1130 260H1300" stroke="#f0b86a" stroke-width="3"/><circle cx="1130" cy="260" r="7" fill="#f0b86a"/><text x="1316" y="256" font-size="34" font-weight="700">Light ring</text><text x="1316" y="292" font-size="24" opacity=".8">shows when Hearth is listening</text></g>
    <g id="cMIC" opacity="0"><path d="M1120 390H1300" stroke="#7fe0b0" stroke-width="3"/><circle cx="1120" cy="390" r="7" fill="#7fe0b0"/><text x="1316" y="386" font-size="34" font-weight="700">Microphone array</text><text x="1316" y="422" font-size="24" opacity=".8">hears across the room</text></g>
    <g id="cPI" opacity="0"><path d="M790 600H520" stroke="#7fe0b0" stroke-width="3"/><circle cx="790" cy="600" r="7" fill="#7fe0b0"/><text x="140" y="596" font-size="40" font-weight="700">Raspberry Pi</text><text x="140" y="634" font-size="24" opacity=".8">wake word, speech recognition,</text><text x="140" y="664" font-size="24" opacity=".8">voice recognition, the brain</text></g>
    <g id="cSPK" opacity="0"><path d="M1100 780H1300" stroke="#7fb7ff" stroke-width="3"/><circle cx="1100" cy="780" r="7" fill="#7fb7ff"/><text x="1316" y="776" font-size="34" font-weight="700">Speaker</text><text x="1316" y="812" font-size="24" opacity=".8">Hearth's neural voice</text></g>
    <g id="cSHELL" opacity="0"><path d="M790 330H520" stroke="#f4a261" stroke-width="3"/><circle cx="790" cy="330" r="7" fill="#f4a261"/><text x="140" y="326" font-size="34" font-weight="700">Ankara cloth wrap</text><text x="140" y="362" font-size="24" opacity=".8">made to look at home on any counter</text></g>
  </g>
</g>`;

// ------------------------------------------------------------------ phone (for "or open it in any browser")
export const PHONE = `
<g id="phone"><rect x="-150" y="-310" width="300" height="620" rx="42" fill="#111" stroke="#3a3a44" stroke-width="6"/><rect x="-134" y="-292" width="268" height="584" rx="30" fill="#05060a"/><rect x="-36" y="-292" width="72" height="18" rx="9" fill="#111"/>
  <text x="0" y="-250" font-size="16" text-anchor="middle" fill="#9aa0ae" font-family="Arial" letter-spacing="4">HEARTH · LEGACYLINK</text></g>`;
