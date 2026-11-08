"use client";

import { useSyncExternalStore } from "react";

const KEY = "equalship.region-ok";
const listeners = new Set<() => void>();

function read(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function write(v: boolean) {
  try {
    if (v) localStorage.setItem(KEY, "1");
    else localStorage.removeItem(KEY);
  } catch {
    // storage blocked, the checkbox still works for this visit
  }
  memo = v;
  listeners.forEach((l) => l());
}

let memo: boolean | undefined;

export function useRegionOk() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => (memo ??= read()),
    () => false,
  );
}

/** Stock Tokens are not offered to US persons or in restricted regions. Buyers confirm before buying. */
export function RegionGate() {
  const ok = useRegionOk();
  return (
    <label className="flex gap-2 rounded-lg border border-line bg-paper p-3 text-xs text-muted">
      <input type="checkbox" checked={ok} onChange={(e) => write(e.target.checked)} className="mt-0.5" />
      <span>
        I am not a US person and I do not live in a country on the Stock Tokens restricted list. If you are, pick a
        WETH only basket.
      </span>
    </label>
  );
}
