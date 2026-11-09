// Takes tall screenshots of every page used in the demo video.
// Usage: node video/capture.mjs [baseUrl]
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { evaluate, launch, sleep } from "./cdp.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, "out", "shots");
const BASE = process.argv[2] || "https://equalship.vercel.app";
const W = 1440;
const SCALE = 4 / 3; // 1440 css px -> 1920 image px

const PAGES = [
  { id: "home", path: "/", height: 4200 },
  { id: "markets", path: "/markets", height: 1700 },
  { id: "asset", path: "/markets/nvda", height: 1500 },
  { id: "circles", path: "/circles", height: 1600 },
  { id: "circle", path: "/circle/0", height: 1500 },
  { id: "wif", path: "/wif", height: 2200 },
  { id: "proof", path: "/proof?address=0xe1a19fbc9608be13b92da24dd4919589900db567", height: 1300 },
  { id: "security", path: "/security", height: 2000 },
  { id: "faq", path: "/faq", height: 1800 },
];

mkdirSync(OUT, { recursive: true });
const c = await launch();
await c.send("Page.enable");
await c.send("Runtime.enable");

for (const p of PAGES) {
  await c.send("Emulation.setDeviceMetricsOverride", { width: W, height: 900, deviceScaleFactor: SCALE, mobile: false });
  await c.send("Page.navigate", { url: BASE + p.path });
  // wait for live data: no "..." placeholders left in the visible text, or 25 seconds
  for (let i = 0; i < 50; i++) {
    await sleep(500);
    const ready = await evaluate(c, `document.readyState === "complete" && !document.body.innerText.slice(0, 4000).includes("...")`).catch(() => false);
    if (ready && i > 6) break;
  }
  // scroll through once so lazy content and animations settle
  await evaluate(c, `(async () => { for (let y = 0; y < ${p.height}; y += 600) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } scrollTo(0, 0); })()`);
  await sleep(1500);
  const full = await evaluate(c, "document.documentElement.scrollHeight");
  const h = Math.min(p.height, full);
  await c.send("Emulation.setDeviceMetricsOverride", { width: W, height: h, deviceScaleFactor: SCALE, mobile: false });
  await sleep(900);
  const shot = await c.send("Page.captureScreenshot", { format: "jpeg", quality: 90 });
  writeFileSync(join(OUT, `${p.id}.jpg`), Buffer.from(shot.data, "base64"));
  console.log(`${p.id}: ${W}x${h} css`);
}
c.close();
