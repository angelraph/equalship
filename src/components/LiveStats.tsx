"use client";

import { ADDR, EXPLORER, isDeployed } from "@/lib/chain";
import { fmt, usd, wifFmt } from "@/lib/format";
import { useStats } from "@/lib/hooks";

export function LiveStats() {
  const s = useStats();
  const burned =
    s.burnedFromFees !== undefined && s.burnedFromSlashes !== undefined && s.burnedFromVotes !== undefined
      ? s.burnedFromFees + s.burnedFromSlashes + s.burnedFromVotes
      : undefined;

  const tiles = [
    { label: "Saved into Stock Tokens", value: usd(s.totalSaved) },
    { label: "Contributions", value: s.totalContributions === undefined ? "..." : fmt(s.totalContributions, 0, 0) },
    { label: "$WIF bonded", value: wifFmt(s.totalBonded) },
    { label: "$WIF burned", value: wifFmt(burned), burn: true },
  ];

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">Live from the contract</h2>
        {isDeployed ? (
          <a className="link text-xs text-muted" href={`${EXPLORER}/address/${ADDR.equalship}`} target="_blank" rel="noreferrer">
            Contract on Blockscout
          </a>
        ) : (
          <span className="text-xs text-warn">Contract address not configured</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="card">
            <p className="label">{t.label}</p>
            <p className={`mt-2 font-mono text-2xl font-semibold ${t.burn ? "text-burn" : ""}`}>{isDeployed ? t.value : "0"}</p>
          </div>
        ))}
      </div>
      {isDeployed && burned !== undefined && (
        <p className="mt-2 text-xs text-muted">
          Burned from fees {wifFmt(s.burnedFromFees)}, from missed weeks {wifFmt(s.burnedFromSlashes)}, from votes{" "}
          {wifFmt(s.burnedFromVotes)}. {usd(s.feePool)} in fees waiting to buy and burn.
        </p>
      )}
    </section>
  );
}
