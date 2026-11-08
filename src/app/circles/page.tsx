"use client";

import Link from "next/link";
import { useReadContracts } from "@/lib/wallet";
import { CreateCircle } from "@/components/CreateCircle";
import { assetByAddress, isDeployed, periodLabel } from "@/lib/chain";
import { usd, wifFmt } from "@/lib/format";
import { ship, useCircleCount, type CircleData } from "@/lib/hooks";

export default function CirclesPage() {
  const { data: count } = useCircleCount();
  const n = Number(count ?? 0n);
  const ids = Array.from({ length: n }, (_, i) => BigInt(n - 1 - i));
  const { data } = useReadContracts({
    contracts: ids.map((id) => ({ ...ship, functionName: "getCircle" as const, args: [id] as const })),
    query: { enabled: isDeployed && n > 0 },
  });

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight">Circles</h1>
        <p className="mt-2 text-muted">Join one that fits your budget, or start your own and share the link.</p>
        <div className="mt-6 space-y-3">
          {!isDeployed && <p className="card text-sm text-warn">The Equalship contract address is not set for this site.</p>}
          {isDeployed && n === 0 && <p className="card text-sm text-muted">No circles yet. Start the first one.</p>}
          {data?.map((res, i) => {
            if (res.status !== "success") return null;
            const [c, legs] = res.result as CircleData;
            const id = ids[i];
            return (
              <Link key={id.toString()} href={`/circle/${id}`} className="card block transition hover:border-ink">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-lg font-semibold">{c.name}</h2>
                  <span className="font-mono text-xs text-muted">#{id.toString()}</span>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {usd(c.contribution)} every {periodLabel(c.period)}, bond {wifFmt(c.bond)} $WIF, {c.memberCount}/
                  {c.maxMembers} members
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {legs.map((l) => (
                    <span key={l.token} className="pill">
                      <b>{assetByAddress(l.token)?.symbol ?? "?"}</b> {l.weightBps / 100}%
                    </span>
                  ))}
                  <span className="pill border-save text-save">{usd(c.totalSaved)} saved</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
      <aside>
        <CreateCircle />
      </aside>
    </div>
  );
}
