"use client";

import { ADDR, EXPLORER, isDeployed } from "@/lib/chain";
import { fmt, usd, wifFmt } from "@/lib/format";
import { useStats } from "@/lib/hooks";

/** Numbers read straight from the Equalship contract. */
export function LiveStats({ compact = false }: { compact?: boolean }) {
  const s = useStats();
  const burned = s.totalBurned;

  const tiles = [
    { label: "Saved into assets", value: usd(s.totalSaved) },
    { label: "Circles", value: s.circleCount === undefined ? "..." : fmt(s.circleCount, 0, 0) },
    { label: "Contributions", value: s.totalContributions === undefined ? "..." : fmt(s.totalContributions, 0, 0) },
    { label: "$WIF bonded", value: wifFmt(s.totalBonded) },
    { label: "$WIF burned", value: wifFmt(burned), burn: true },
  ];

  return (
    <div>
      <div className={`grid gap-3 ${compact ? "grid-cols-2 md:grid-cols-5" : "grid-cols-2 md:grid-cols-5"}`}>
        {tiles.map((t) => (
          <div key={t.label} className="rounded-3xl border border-line bg-card p-5">
            <p className="label">{t.label}</p>
            <p className={`mt-2 font-mono text-2xl font-semibold ${t.burn ? "text-burn" : ""}`}>{isDeployed ? t.value : "0"}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span className="flex items-center gap-2">
          <span className="live-dot" /> Live from the contract on Robinhood Chain. {wifFmt(s.wifBoughtForBonds)} $WIF bought from the market for bonds, {usd(s.feePool)} in fees waiting to buy and burn.
        </span>
        {isDeployed && (
          <a className="link" href={`${EXPLORER}/address/${ADDR.equalship}`} target="_blank" rel="noreferrer">
            Contract on Blockscout
          </a>
        )}
      </div>
    </div>
  );
}
