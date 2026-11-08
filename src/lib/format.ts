import { formatUnits } from "viem";

export function fmt(value: bigint | undefined, decimals: number, digits = 2): string {
  if (value === undefined) return "...";
  const n = Number(formatUnits(value, decimals));
  if (n !== 0 && Math.abs(n) < 10 ** -digits) return `<${(10 ** -digits).toFixed(digits)}`;
  return n.toLocaleString("en-US", { maximumFractionDigits: digits });
}

export const usd = (v: bigint | undefined) => (v === undefined ? "..." : `$${fmt(v, 6, 2)}`);
export const wifFmt = (v: bigint | undefined) => fmt(v, 18, 0);

export function short(addr?: string): string {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function countdown(secondsLeft: number): string {
  if (secondsLeft <= 0) return "now";
  const d = Math.floor(secondsLeft / 86_400);
  const h = Math.floor((secondsLeft % 86_400) / 3600);
  const m = Math.floor((secondsLeft % 3600) / 60);
  const s = Math.floor(secondsLeft % 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}

export function errorText(e: unknown): string {
  if (!e) return "";
  const err = e as { shortMessage?: string; message?: string };
  const msg = err.shortMessage || err.message || String(e);
  return msg.split("\n")[0].slice(0, 180);
}
