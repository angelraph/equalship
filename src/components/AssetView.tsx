"use client";

import Link from "next/link";
import { ASSETS, EXPLORER, assetBySymbol } from "@/lib/chain";
import { compact, money, pct, useQuote } from "@/lib/useMarket";
import { PriceChart } from "./Charts";
import { AssetBadge } from "./MarketBits";
import { Container } from "./ui";

export function AssetView({ symbol }: { symbol: string }) {
  const asset = assetBySymbol(symbol)!;
  const { data: q, dataUpdatedAt, isError } = useQuote(symbol);
  const up = (q?.change24h ?? 0) >= 0;

  const stats = [
    { label: "24h high", value: money(q?.high24h) },
    { label: "24h low", value: money(q?.low24h) },
    { label: "Bid", value: q?.bid ? money(q.bid) : "pool price" },
    { label: "Ask", value: q?.ask ? money(q.ask) : "pool price" },
    { label: "Pool volume, 24h", value: compact(q?.volume24h) },
    { label: "Trading", value: q?.halted ? "Halted" : "Open" },
  ];

  return (
    <Container className="py-10">
      <Link href="/markets" className="text-sm text-muted hover:text-ink">
        &larr; All markets
      </Link>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
        <div className="flex items-center gap-4">
          <AssetBadge symbol={asset.symbol} size={56} />
          <div>
            <h1 className="display text-4xl">{asset.name}</h1>
            <p className="text-muted">
              {asset.symbol} {asset.stock ? "Stock Token" : ""} on Robinhood Chain
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono text-4xl font-semibold">{money(q?.price)}</p>
          <p className={`font-mono ${up ? "text-up" : "text-down"}`}>{pct(q?.change24h)} today</p>
        </div>
      </div>

      <div className="card mt-8 p-6 md:p-8">
        <div className="mb-4 flex items-center justify-between text-xs text-muted">
          <span className="flex items-center gap-2">
            <span className="live-dot" /> Live, updated {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : "..."}
          </span>
          <span>Last 24 hours, hourly</span>
        </div>
        {isError ? <p className="py-20 text-center text-muted">Prices are unavailable right now.</p> : <PriceChart candles={q?.candles} />}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-3xl border border-line bg-card p-5">
              <p className="label">{s.label}</p>
              <p className="mt-2 font-mono text-lg font-semibold">{s.value}</p>
            </div>
          ))}
        </div>
        <div className="card">
          <h2 className="font-semibold">About {asset.symbol}</h2>
          <p className="mt-2 text-sm text-muted">{asset.blurb}</p>
          <dl className="mt-4 space-y-2 text-xs">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Token</dt>
              <dd>
                <a className="link font-mono" href={`${EXPLORER}/token/${asset.address}`} target="_blank" rel="noreferrer">
                  {asset.address.slice(0, 8)}...{asset.address.slice(-6)}
                </a>
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Data</dt>
              <dd className="text-right">{q?.source ?? "..."}</dd>
            </div>
          </dl>
          {asset.basket ? (
            <Link href="/circles" className="btn btn-primary mt-6 w-full">
              Save into {asset.symbol} with a circle
            </Link>
          ) : (
            <Link href="/wif" className="btn btn-primary mt-6 w-full">
              See the $WIF burn
            </Link>
          )}
          {asset.stock && (
            <p className="mt-3 text-xs text-muted">Not available to US persons or in restricted regions.</p>
          )}
        </div>
      </div>

      <div className="mt-10">
        <p className="label mb-3">Other markets</p>
        <div className="flex flex-wrap gap-2">
          {ASSETS.filter((a) => a.symbol !== asset.symbol).map((a) => (
            <Link key={a.symbol} href={`/markets/${a.symbol.toLowerCase()}`} className="pill px-4 py-1.5 hover:border-brand">
              {a.symbol}
            </Link>
          ))}
        </div>
      </div>
    </Container>
  );
}
