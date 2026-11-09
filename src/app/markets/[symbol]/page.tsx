import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AssetView } from "@/components/AssetView";
import { ASSETS, assetBySymbol } from "@/lib/chain";

export function generateStaticParams() {
  return ASSETS.map((a) => ({ symbol: a.symbol.toLowerCase() }));
}

export async function generateMetadata({ params }: { params: Promise<{ symbol: string }> }): Promise<Metadata> {
  const { symbol } = await params;
  const a = assetBySymbol(symbol);
  return a ? { title: `${a.symbol} live price`, description: `${a.name} on Robinhood Chain: live price and 24 hour chart.` } : {};
}

export default async function AssetPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const asset = assetBySymbol(symbol);
  if (!asset) notFound();
  return <AssetView symbol={asset.symbol} />;
}
