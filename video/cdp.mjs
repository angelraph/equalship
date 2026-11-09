// Minimal Chrome DevTools Protocol client using Node's built in WebSocket. No dependencies.
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
];

export async function launch({ port = 9333, headless = true, extra = [] } = {}) {
  const exe = CHROME.find((p) => {
    try {
      return !!process.getBuiltinModule("node:fs").statSync(p);
    } catch {
      return false;
    }
  });
  if (!exe) throw new Error("Chrome or Edge not found");
  const profile = mkdtempSync(join(tmpdir(), "eq-chrome-"));
  const args = [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--hide-scrollbars",
    "--autoplay-policy=no-user-gesture-required",
    ...(headless ? ["--headless=new"] : []),
    ...extra,
    "about:blank",
  ];
  const proc = spawn(exe, args, { stdio: "ignore" });
  let ws;
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = list.find((t) => t.type === "page");
      if (page) {
        ws = page.webSocketDebuggerUrl;
        break;
      }
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  if (!ws) throw new Error("Chrome did not start");
  const client = await connect(ws);
  client.close = () => proc.kill();
  return client;
}

async function connect(url) {
  const sock = new WebSocket(url);
  await new Promise((res, rej) => {
    sock.onopen = res;
    sock.onerror = rej;
  });
  let id = 0;
  const pending = new Map();
  const listeners = new Map();
  sock.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) rej(new Error(msg.error.message));
      else res(msg.result);
    } else if (msg.method) {
      (listeners.get(msg.method) || []).forEach((fn) => fn(msg.params));
    }
  };
  const send = (method, params = {}) =>
    new Promise((res, rej) => {
      const n = ++id;
      pending.set(n, { res, rej });
      sock.send(JSON.stringify({ id: n, method, params }));
    });
  const on = (method, fn) => listeners.set(method, [...(listeners.get(method) || []), fn]);
  return { send, on };
}

export async function evaluate(client, expression) {
  const r = await client.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + " " + (r.exceptionDetails.exception?.description ?? ""));
  return r.result.value;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
