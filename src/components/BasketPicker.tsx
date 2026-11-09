"use client";

import { BASKET_ASSETS as ASSETS, pathFor, type Asset } from "@/lib/chain";

export type Weights = Record<string, number>;

export function basketFrom(weights: Weights) {
  const picked = ASSETS.filter((a) => weights[a.symbol] !== undefined && weights[a.symbol] > 0);
  const total = picked.reduce((s, a) => s + weights[a.symbol], 0);
  return {
    picked,
    total,
    valid: picked.length > 0 && total === 100,
    needsStock: picked.some((a: Asset) => a.stock),
    legs: picked.map((a) => ({ token: a.address, weightBps: weights[a.symbol] * 100, path: pathFor(a) })),
  };
}

export function BasketPicker({ weights, onChange }: { weights: Weights; onChange: (w: Weights) => void }) {
  const { picked, total } = basketFrom(weights);

  function toggle(sym: string) {
    const next = { ...weights };
    if (next[sym] !== undefined) delete next[sym];
    else next[sym] = 0;
    const keys = Object.keys(next);
    const even = Math.floor(100 / Math.max(keys.length, 1));
    keys.forEach((k, i) => (next[k] = i === keys.length - 1 ? 100 - even * (keys.length - 1) : even));
    onChange(next);
  }

  return (
    <div>
      <p className="label mb-2">Basket</p>
      <div className="flex flex-wrap gap-2">
        {ASSETS.map((a) => (
          <button
            key={a.symbol}
            type="button"
            title={a.name}
            onClick={() => toggle(a.symbol)}
            className={`pill ${weights[a.symbol] !== undefined ? "border-ink bg-ink text-paper" : ""}`}
          >
            {a.symbol}
          </button>
        ))}
      </div>
      <div className="mt-3 space-y-2">
        {picked.map((a) => (
          <div key={a.symbol} className="flex items-center gap-3 text-sm">
            <span className="w-14 font-mono">{a.symbol}</span>
            <input
              type="range"
              min={1}
              max={100}
              value={weights[a.symbol]}
              onChange={(e) => onChange({ ...weights, [a.symbol]: Number(e.target.value) })}
              className="flex-1 accent-[var(--color-save)]"
            />
            <span className="w-10 text-right font-mono">{weights[a.symbol]}%</span>
          </div>
        ))}
      </div>
      {picked.length > 0 && total !== 100 && (
        <p className="mt-1 text-xs text-burn">Weights add up to {total}%, they need to add up to 100%.</p>
      )}
      {picked.length > 5 && <p className="mt-1 text-xs text-burn">Pick at most 5 assets.</p>}
    </div>
  );
}
