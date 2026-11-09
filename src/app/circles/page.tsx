"use client";

import Link from "next/link";
import { CreateCircle } from "@/components/CreateCircle";
import { AssetBadge } from "@/components/MarketBits";
import { Container, PageHero } from "@/components/ui";
import { assetByAddress, isDeployed, periodLabel } from "@/lib/chain";
import { usd, wifFmt } from "@/lib/format";
import { ship, useCircleCount, type CircleData } from "@/lib/hooks";
import { useReadContracts } from "@/lib/wallet";

export default function CirclesPage() {
  const { data: count, isLoading } = useCircleCount();
  const n = Number(count ?? 0n);
  const ids = Array.from({ length: n }, (_, i) => BigInt(n - 1 - i));
  const { data } = useReadContracts({
    contracts: ids.map((id) => ({ ...ship, functionName: "getCircle" as const, args: [id] as const })),
    query: { enabled: isDeployed && n > 0 },
  });

  return (
    <>
      <PageHero
        eyebrow="Circles"
        title={
          <>
            Find your <span className="serif-accent text-brand-2">circle</span>
          </>
        }
        sub="Join one that fits your budget, or start your own and share the link. Every circle lives onchain and every save buys real assets into your own wallet."
      />
      <Container className="grid grid-cols-[minmax(0,1fr)] gap-8 py-12 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="display text-2xl">Open circles</h2>
            <span className="text-sm text-muted">{isDeployed ? `${n} total` : ""}</span>
          </div>
          <div className="space-y-4">
            {!isDeployed && <p className="card text-sm text-warn">The Equalship contract address is not set for this site.</p>}
            {isDeployed && isLoading && <div className="card h-36 animate-pulse" />}
            {isDeployed && !isLoading && n === 0 && <p className="card text-sm text-muted">No circles yet. Start the first one.</p>}
            {data?.map((res, i) => {
              if (res.status !== "success") return null;
              const [c, legs] = res.result as CircleData;
              const id = ids[i];
              const fill = (c.memberCount / c.maxMembers) * 100;
              return (
                <Link
                  key={id.toString()}
                  href={`/circle/${id}`}
                  className="card group block transition hover:-translate-y-0.5 hover:border-brand"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs text-muted">Circle #{id.toString()}</p>
                      <h3 className="display mt-1 text-2xl">{c.name}</h3>
                    </div>
                    <div className="flex -space-x-2">
                      {legs.map((l) => (
                        <AssetBadge key={l.token} symbol={assetByAddress(l.token)?.symbol ?? "?"} size={34} />
                      ))}
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="label">Save</p>
                      <p className="mt-1 font-mono font-semibold">
                        {usd(c.contribution)}
                        <span className="text-xs font-normal text-muted"> / {periodLabel(c.period)}</span>
                      </p>
                    </div>
                    <div>
                      <p className="label">Bond</p>
                      <p className="mt-1 font-mono font-semibold">{wifFmt(c.bond)} $WIF</p>
                    </div>
                    <div>
                      <p className="label">Saved</p>
                      <p className="mt-1 font-mono font-semibold text-brand-2">{usd(c.totalSaved)}</p>
                    </div>
                  </div>
                  <div className="mt-5">
                    <div className="flex justify-between text-xs text-muted">
                      <span>
                        {c.memberCount} of {c.maxMembers} members
                      </span>
                      <span>
                        {legs.map((l) => `${assetByAddress(l.token)?.symbol ?? "?"} ${l.weightBps / 100}%`).join(", ")}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-card-2">
                      <div className="h-full rounded-full bg-gradient-to-r from-brand-2 to-brand-deep" style={{ width: `${fill}%` }} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
        <aside>
          <CreateCircle />
        </aside>
      </Container>
    </>
  );
}
