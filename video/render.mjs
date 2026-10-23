// Stage 2: render frames of the film with a headless browser (Edge/Chrome), deterministically.
//   node video/render.mjs --at 5,30,80 --out qa        (a few stills, for checking)
//   node video/render.mjs --all --out frames            (every frame at 30 fps)
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const here = path.dirname(fileURLToPath(import.meta.url)), root = path.join(here, "..");
const args = process.argv.slice(2), arg = (k, d) => { const i = args.indexOf("--" + k); return i < 0 ? d : args[i + 1] === undefined || args[i + 1].startsWith("--") ? true : args[i + 1]; };
const outDir = path.resolve(here, "out", arg("out", "qa")), at = arg("at", ""), all = !!arg("all", false);
const from = Number(arg("from", 0)), to = Number(arg("to", Infinity));
fs.mkdirSync(outDir, { recursive: true });

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".mp3": "audio/mpeg" };
const srv = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split("?")[0]);
  const map = u.startsWith("/p/") ? path.join(root, "public", u.slice(3)) : u.startsWith("/out/") ? path.join(here, "out", u.slice(5)) : path.join(here, "film", u === "/" ? "film.html" : u);
  fs.readFile(map, (e, d) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, { "content-type": TYPES[path.extname(map)] || "application/octet-stream" }); res.end(d); });
}).listen(0);
await new Promise((r) => srv.once("listening", r));
const port = srv.address().port;

const exe = ["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"].find((p) => fs.existsSync(p));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "ll-film-browser-"));
const browser = await puppeteer.launch({ executablePath: exe, headless: "new", userDataDir: profile, args: ["--no-sandbox", "--disable-gpu-sandbox", "--hide-scrollbars", "--force-device-scale-factor=1", "--font-render-hinting=none"] });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
page.on("pageerror", (e) => console.error("PAGE ERROR:", e.message));
page.on("console", (m) => { if (m.type() === "error") console.error("console:", m.text()); });
await page.goto(`http://127.0.0.1:${port}/`);
await page.waitForFunction("window.READY === true", { timeout: 30000 });
const total = await page.evaluate("window.TOTAL"), FPS = 30;

if (all) {
  const n = Math.ceil(total * FPS), a = Math.floor(from * FPS), z = Math.min(n, Math.floor(to * FPS));
  const t0 = Date.now();
  for (let k = Math.max(0, a - 90); k < a; k++) await page.evaluate((t) => window.render(t), k / FPS); // pre-roll so orbs and glow are in the right state when resuming
  for (let i = a; i < z; i++) {
    await page.evaluate((t) => window.render(t), i / FPS);
    const file = path.join(outDir, `f${String(i).padStart(6, "0")}.jpg`);
    for (let attempt = 0; ; attempt++) { try { await page.screenshot({ path: file, type: "jpeg", quality: 93, timeout: 60000 }); break; } catch (e) { if (attempt >= 3) throw e; console.error("screenshot retry", i); await new Promise((r) => setTimeout(r, 1500)); } }
    if (i % 60 === 0) process.stdout.write(`\rframe ${i}/${n}  ${(((i - a) / Math.max(1, (Date.now() - t0) / 1000))).toFixed(1)} fps  eta ${Math.round((z - i) / Math.max(0.1, (i - a + 1) / ((Date.now() - t0) / 1000)))}s   `);
  }
  console.log("\nframes done:", z - a);
} else {
  for (const s of String(at).split(",").filter(Boolean)) {
    await page.evaluate((t) => { window.__star = false; window.__hl = false; }, 0);
    // warm the clock so the orbs have smoothed state, then draw the frame we want
    const t = Number(s);
    for (let k = 6; k >= 0; k--) await page.evaluate((x) => window.render(x), Math.max(0, t - k / 30));
    await page.screenshot({ path: path.join(outDir, `t${String(s).padStart(6, "0")}.png`) });
    console.log("wrote", s);
  }
}
await browser.close(); srv.close();
