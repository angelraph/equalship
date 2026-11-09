// Renders the demo film frame by frame in headless Chrome, then encodes MP4 with ffmpeg.
// Usage: python video/narrate.py && node video/capture.mjs && node video/record.mjs
// Needs ffmpeg: set FFMPEG, or `pip install imageio-ffmpeg`.
import { execSync, spawn } from "node:child_process";
import { createReadStream, existsSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { evaluate, launch, sleep } from "./cdp.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, "out");
const PORT = 8777;
const FPS = 30;
const TYPES = { ".html": "text/html", ".json": "application/json", ".mp3": "audio/mpeg", ".jpg": "image/jpeg" };

const ffmpeg =
  process.env.FFMPEG || execSync(`python -c "import imageio_ffmpeg as f;print(f.get_ffmpeg_exe())"`).toString().trim();

const srtTime = (s) => {
  const ms = Math.round(s * 1000);
  const p = (n, w = 2) => String(n).padStart(w, "0");
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};

const server = createServer((req, res) => {
  const path = normalize(join(here, decodeURIComponent(req.url.split("?")[0]))).replace(/\\/g, "/");
  if (!path.startsWith(here.replace(/\\/g, "/")) || !existsSync(path)) {
    res.statusCode = 404;
    res.end();
    return;
  }
  res.setHeader("content-type", TYPES[extname(path)] || "application/octet-stream");
  createReadStream(path).pipe(res);
});
server.listen(PORT);

const c = await launch({ port: 9334 });
await c.send("Page.enable");
await c.send("Page.navigate", { url: `http://127.0.0.1:${PORT}/film.html` });
for (;;) {
  const s = await evaluate(c, "window.__status || 'starting'").catch(() => "starting");
  if (s === "ready") break;
  if (s.startsWith("error")) throw new Error(s);
  await sleep(500);
}
const plan = await evaluate(c, "window.__plan");
const frames = Math.ceil(plan.total * FPS);
console.log(`plan: ${plan.scenes.length} scenes, ${plan.total.toFixed(1)}s, ${frames} frames`);

// narration clips, each delayed to its scene's speech start
const audioInputs = plan.scenes.flatMap((s) => ["-i", join(OUT, "audio", `${s.id}.mp3`)]);
const delays = plan.scenes
  .map((s, i) => {
    const ms = Math.round((s.start + s.speech) * 1000);
    return `[${i + 1}:a]adelay=${ms}|${ms},volume=1.6[a${i}]`;
  })
  .join(";");
const mix = `${delays};${plan.scenes.map((_, i) => `[a${i}]`).join("")}amix=inputs=${plan.scenes.length}:normalize=0,apad[aout]`;

const enc = spawn(
  ffmpeg,
  [
    "-y",
    "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
    ...audioInputs,
    "-filter_complex", mix,
    "-map", "0:v", "-map", "[aout]",
    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "192k",
    "-movflags", "+faststart", "-shortest",
    join(OUT, "equalship-demo.mp4"),
  ],
  { stdio: ["pipe", "ignore", "pipe"] },
);
let errLog = "";
enc.stderr.on("data", (d) => (errLog = (errLog + d).slice(-3000)));
const finished = new Promise((res) => enc.on("close", res));

for (let i = 0; i < frames; i++) {
  const url = await evaluate(c, `window.renderFrame(${i / FPS})`);
  const buf = Buffer.from(url.slice(url.indexOf(",") + 1), "base64");
  if (!enc.stdin.write(buf)) await new Promise((r) => enc.stdin.once("drain", r));
  if (i % 300 === 0) console.log(`frame ${i}/${frames}`);
}
enc.stdin.end();
const code = await finished;
if (code !== 0) {
  console.error(errLog);
  process.exit(1);
}

// captions and transcript from the same plan
let srt = "";
let n = 1;
let md = `# Equalship demo video transcript\n\nLength ${Math.floor(plan.total / 60)}m ${Math.round(plan.total % 60)}s.\n\n`;
for (const s of plan.scenes) {
  const words = s.text.split(" ");
  const chunks = [];
  for (let i = 0; i < words.length; i += 11) chunks.push(words.slice(i, i + 11).join(" "));
  const per = s.audioDur / chunks.length;
  const t = s.start + s.speech;
  chunks.forEach((ch, i) => {
    srt += `${n++}\n${srtTime(t + i * per)} --> ${srtTime(t + (i + 1) * per)}\n${ch}\n\n`;
  });
  md += `**${srtTime(s.start).slice(3, 8)} ${s.caption}**\n\n${s.text}\n\n`;
}
writeFileSync(join(OUT, "equalship-demo.srt"), srt);
writeFileSync(join(OUT, "equalship-demo-transcript.md"), md);
console.log("done: out/equalship-demo.mp4, .srt and transcript");
c.close();
server.close();
