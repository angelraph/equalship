import { assetBySymbol } from "@/lib/chain";
import { allQuotes, quoteFor } from "@/lib/market";

export async function GET(req: Request) {
  const symbol = new URL(req.url).searchParams.get("symbol");
  if (symbol) {
    const asset = assetBySymbol(symbol);
    if (!asset) return Response.json({ error: "unknown symbol" }, { status: 404 });
    return Response.json(await quoteFor(asset), {
      headers: { "cache-control": "public, s-maxage=15, stale-while-revalidate=60" },
    });
  }
  return Response.json(await allQuotes(), {
    headers: { "cache-control": "public, s-maxage=15, stale-while-revalidate=60" },
  });
}
