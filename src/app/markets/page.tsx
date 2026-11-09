import type { Metadata } from "next";
import { MarketTable } from "@/components/MarketTable";
import { Container, PageHero } from "@/components/ui";

export const metadata: Metadata = {
  title: "Markets",
  description: "Live prices and 24 hour charts for every asset an Equalship circle can buy on Robinhood Chain.",
};

export default function MarketsPage() {
  return (
    <>
      <PageHero
        eyebrow="Markets"
        title={
          <>
            Live prices for everything your circle can <span className="serif-accent text-brand-2">own</span>
          </>
        }
        sub="Stock Token quotes from the Robinhood Chain pricing API, and charts built from trades in the Uniswap pools that Equalship swaps through. Refreshed every few seconds."
      />
      <Container className="py-12">
        <MarketTable />
      </Container>
    </>
  );
}
