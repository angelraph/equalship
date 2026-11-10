"use client";

import { erc20Abi } from "@/lib/abis";
import { ADDR, isDeployed } from "@/lib/chain";
import { usd, wifFmt } from "@/lib/format";
import { useStats } from "@/lib/hooks";
import { money, pct, useQuote } from "@/lib/useMarket";
import { useReadContract } from "@/lib/wallet";
import { PriceChart } from "./Charts";

const GENESIS_SUPPLY = 1_000_000_000n * 10n ** 18n;

export function WifLive() {
  const s = useStats();
  const { data: q } = useQuote("WIF");
  const { data: supply } = useReadContract({ address: ADDR.wif, abi: erc20Abi, functionName: "totalSupply" });
  const burned =
    s.burnedFromFees !== undefined && s.burnedFromSlashes !== undefined && s.burnedFromVotes !== undefined
      ? s.burnedFromFees + s.burnedFromSlashes + s.burnedFromVotes
      : undefined;

  const rows = [
    { label: "From fee buybacks", v: s.burnedFromFees },
    { label: "From missed periods", v: s.burnedFromSlashes },
    { label: "From basket votes", v: s.burnedFromVotes },
  ];
  const total = burned && burned > 0n ? burned : 1n;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <div className="card p-6 md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label">$WIF price</p>
            <p className="mt-1 font-mono text-3xl font-semibold">{money(q?.price)}</p>
          </div>
          <p className={`font-mono ${(q?.change24h ?? 0) >= 0 ? "text-up" : "text-down"}`}>{pct(q?.change24h)} in 24h</p>
        </div>
        <div className="mt-6">
          <PriceChart candles={q?.candles} height={260} />
        </div>
      </div>
      <div className="space-y-4">
        <div className="card">
          <p className="label">Burned by Equalship</p>
          <p className="mt-2 font-mono text-4xl font-semibold text-burn">{isDeployed ? wifFmt(burned) : "0"}</p>
          <p className="text-xs text-muted">Burned with $WIF&apos;s own burn(), so the total supply goes down</p>
          <div className="mt-5 space-y-3">
            {rows.map((r) => (
              <div key={r.label}>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">{r.label}</span>
                  <span className="font-mono">{wifFmt(r.v)}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-card-2">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-burn to-brand"
                    style={{ width: `${r.v ? Number((r.v * 100n) / total) : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="card">
            <p className="label">Bonded now</p>
            <p className="mt-2 font-mono text-xl font-semibold">{wifFmt(s.totalBonded)}</p>
          </div>
          <div className="card">
            <p className="label">Fees to burn</p>
            <p className="mt-2 font-mono text-xl font-semibold">{usd(s.feePool)}</p>
          </div>
        </div>
        <div className="card">
          <p className="label">$WIF total supply, live</p>
          <p className="mt-2 font-mono text-xl font-semibold">{wifFmt(supply)}</p>
          <p className="text-xs text-muted">
            {supply !== undefined ? `${wifFmt(GENESIS_SUPPLY - supply)} burned by everyone since launch` : "..."}
          </p>
        </div>
      </div>
    </div>
  );
}
