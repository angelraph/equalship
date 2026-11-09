import { ASSETS, type Asset } from "./chain";

export type Candle = { t: number; c: number };

export type Quote = {
  symbol: string;
  name: string;
  address: string;
  price: number | null;
  change24h: number | null;
  high24h: number | null;
  low24h: number | null;
  volume24h: number | null;
  bid: number | null;
  ask: number | null;
  halted: boolean;
  candles: Candle[];
  source: string;
  updatedAt: string;
};

const DEX = "https://api.dexpaprika.com/networks/robinhood";
const RH = "https://api.robinhood.com/rhj/prices";

type DexCandle = { time_close: string; close: number; high: number; low: number; volume: number };

async function getJson<T>(url: string, revalidate: number): Promise<T | null> {
  try {
    const headers: Record<string, string> = { accept: "application/json" };
    if (process.env.DEXPAPRIKA_API_KEY && url.startsWith(DEX)) {
      headers.authorization = `Bearer ${process.env.DEXPAPRIKA_API_KEY}`;
    }
    const res = await fetch(url, { headers, next: { revalidate } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function candlesFor(asset: Asset): Promise<DexCandle[]> {
  const days = process.env.DEXPAPRIKA_API_KEY ? 7 : 1;
  // the keyless tier serves 24 hours of hourly candles; stay just inside it
  const start = new Date(Date.now() - (days * 24 - 1) * 3_600_000).toISOString().slice(0, 19) + "Z";
  const q = new URLSearchParams({ start, interval: "1h", limit: String(days * 24) });
  if (asset.inversed) q.set("inversed", "true");
  const data = await getJson<DexCandle[]>(`${DEX}/pools/${asset.pool}/ohlcv?${q}`, 300);
  return Array.isArray(data) ? data : [];
}

type RhQuote = {
  quotes?: {
    bid?: string;
    ask?: string;
    dailyHigh?: string;
    dailyLow?: string;
    dailyTradingVolume?: string;
    isTradingHalt?: boolean;
    generatedAt?: string;
    previousClose?: string;
  }[];
};

export async function quoteFor(asset: Asset): Promise<Quote> {
  const [candles, rh] = await Promise.all([
    candlesFor(asset),
    asset.stock ? getJson<RhQuote>(`${RH}/${asset.symbol}`, 15) : Promise.resolve(null),
  ]);

  const series = candles.map((k) => ({ t: Date.parse(k.time_close), c: k.close }));
  const first = series[0]?.c ?? null;
  const lastCandle = series[series.length - 1]?.c ?? null;

  const q = rh?.quotes?.[0];
  const bid = q?.bid ? Number(q.bid) : null;
  const ask = q?.ask ? Number(q.ask) : null;
  const mid = bid !== null && ask !== null ? (bid + ask) / 2 : null;
  const price = mid ?? lastCandle;

  if (price !== null && series.length > 0 && mid !== null) {
    series.push({ t: Date.now(), c: mid });
  }

  const highs = candles.map((k) => k.high);
  const lows = candles.map((k) => k.low);

  return {
    symbol: asset.symbol,
    name: asset.name,
    address: asset.address,
    price,
    change24h: first && price ? ((price - first) / first) * 100 : null,
    high24h: q?.dailyHigh ? Number(q.dailyHigh) : highs.length ? Math.max(...highs) : null,
    low24h: q?.dailyLow ? Number(q.dailyLow) : lows.length ? Math.min(...lows) : null,
    volume24h: candles.reduce((s, k) => s + (k.volume || 0), 0) || null,
    bid,
    ask,
    halted: !!q?.isTradingHalt,
    candles: series,
    source: asset.stock ? "Robinhood Chain quote API and Uniswap pool trades" : "Uniswap pool trades",
    updatedAt: new Date().toISOString(),
  };
}

export async function allQuotes(): Promise<Quote[]> {
  return Promise.all(ASSETS.map(quoteFor));
}
