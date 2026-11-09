"use client";

import Link from "next/link";
import { ASSETS } from "@/lib/chain";
import { compact, money, pct, useMarket } from "@/lib/useMarket";
import { Sparkline } from "./Charts";
import { AssetBadge } from "./MarketBits";

export function MarketTable() {
  const { data, dataUpdatedAt } = useMarket();
  return (
    <div>
      <div className="mb-4 flex items-center justify-between text-xs text-muted">
        <span className="flex items-center gap-2">
          <span className="live-dot" /> Live. Last update {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : "loading"}
        </span>
        <span>24 hour window</span>
      </div>
      <div className="overflow-x-auto rounded-3xl border border-line bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              <th className="px-6 py-4 font-medium">Asset</th>
              <th className="px-4 py-4 text-right font-medium">Price</th>
              <th className="px-4 py-4 text-right font-medium">24h</th>
              <th className="px-4 py-4 text-right font-medium">24h range</th>
              <th className="px-4 py-4 text-right font-medium">Pool volume</th>
              <th className="px-6 py-4 font-medium">Trend</th>
            </tr>
          </thead>
          <tbody>
            {ASSETS.map((a) => {
              const q = data?.find((d) => d.symbol === a.symbol);
              const up = (q?.change24h ?? 0) >= 0;
              return (
                <tr key={a.symbol} className="border-b border-line last:border-0 transition hover:bg-card-2">
                  <td className="px-6 py-4">
                    <Link href={`/markets/${a.symbol.toLowerCase()}`} className="flex items-center gap-3">
                      <AssetBadge symbol={a.symbol} />
                      <span>
                        <span className="block font-semibold">{a.symbol}</span>
                        <span className="block text-xs text-muted">
                          {a.name} {a.stock ? "· Stock Token" : a.symbol === "WIF" ? "· bond and burn" : ""}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-right font-mono font-semibold">{money(q?.price)}</td>
                  <td className={`px-4 py-4 text-right font-mono ${up ? "text-up" : "text-down"}`}>{pct(q?.change24h)}</td>
                  <td className="px-4 py-4 text-right font-mono text-xs text-muted">
                    {q?.low24h && q?.high24h ? `${money(q.low24h)} to ${money(q.high24h)}` : "..."}
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-xs text-muted">{compact(q?.volume24h)}</td>
                  <td className="px-6 py-4">
                    <Link href={`/markets/${a.symbol.toLowerCase()}`}>
                      <Sparkline candles={q?.candles} width={120} height={36} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-muted">
        Prices are for information only and can lag. A circle always swaps at a live onchain quote with a slippage
        limit. Stock Tokens are not available to US persons or in restricted regions.
      </p>
    </div>
  );
}
