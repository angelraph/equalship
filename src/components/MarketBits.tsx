"use client";

import Link from "next/link";
import { ASSETS } from "@/lib/chain";
import { money, pct, useMarket } from "@/lib/useMarket";
import { Sparkline } from "./Charts";

/** Scrolling strip of live prices, the Public style ticker. */
export function Ticker() {
  const { data } = useMarket();
  const rows = data ?? ASSETS.map((a) => ({ symbol: a.symbol, name: a.name, price: null, change24h: null, candles: [] }));
  const loop = [...rows, ...rows];
  return (
    <div className="relative overflow-hidden border-y border-line bg-paper-2 py-3 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
      <div className="flex w-max animate-[marquee_40s_linear_infinite] gap-3 hover:[animation-play-state:paused]">
        {loop.map((q, i) => (
          <Link
            key={`${q.symbol}-${i}`}
            href={`/markets/${q.symbol.toLowerCase()}`}
            className="flex items-center gap-3 rounded-full border border-line bg-card px-4 py-1.5 text-sm hover:border-brand"
          >
            <span className="font-semibold">{q.symbol}</span>
            <span className="font-mono text-muted">{money(q.price)}</span>
            <span className={`font-mono text-xs ${(q.change24h ?? 0) >= 0 ? "text-up" : "text-down"}`}>{pct(q.change24h)}</span>
            <Sparkline candles={q.candles} width={56} height={20} />
          </Link>
        ))}
      </div>
    </div>
  );
}

/** Grid of asset cards with live sparklines. */
export function MarketGrid({ limit }: { limit?: number }) {
  const { data, isLoading } = useMarket();
  const assets = limit ? ASSETS.slice(0, limit) : ASSETS;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {assets.map((a) => {
        const q = data?.find((d) => d.symbol === a.symbol);
        const up = (q?.change24h ?? 0) >= 0;
        return (
          <Link
            key={a.symbol}
            href={`/markets/${a.symbol.toLowerCase()}`}
            className="card group flex flex-col gap-4 p-5 transition hover:-translate-y-1 hover:border-brand"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AssetBadge symbol={a.symbol} />
                <div>
                  <p className="font-semibold leading-tight">{a.symbol}</p>
                  <p className="text-xs text-muted">{a.name}</p>
                </div>
              </div>
              <span className={`rounded-full px-2 py-0.5 font-mono text-xs ${up ? "bg-up-soft text-up" : "bg-down-soft text-down"}`}>
                {q ? pct(q.change24h) : "..."}
              </span>
            </div>
            <Sparkline candles={q?.candles} width={260} height={56} />
            <div className="flex items-end justify-between">
              <p className="font-mono text-xl font-semibold">{isLoading ? "..." : money(q?.price)}</p>
              <span className="text-xs text-muted transition group-hover:text-brand-2">24h chart &rarr;</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

const BADGE: Record<string, string> = {
  NVDA: "from-[#76b900] to-[#3d6b00]",
  AAPL: "from-[#9ca3af] to-[#4b5563]",
  TSLA: "from-[#e82127] to-[#7f1d1d]",
  MSFT: "from-[#00a4ef] to-[#0b5394]",
  SPY: "from-[#2563eb] to-[#1e3a8a]",
  QQQ: "from-[#14b8a6] to-[#115e59]",
  WETH: "from-[#8c8dfc] to-[#3b3c99]",
  WIF: "from-[#a78bfa] to-[#6d28d9]",
};

export function AssetBadge({ symbol, size = 40 }: { symbol: string; size?: number }) {
  return (
    <span
      style={{ width: size, height: size }}
      className={`grid shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${BADGE[symbol] ?? "from-brand-2 to-brand-deep"} font-display text-[0.62rem] font-bold text-white`}
    >
      {symbol.slice(0, 4)}
    </span>
  );
}
