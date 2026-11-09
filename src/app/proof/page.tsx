import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProofLookup } from "@/components/ProofLookup";
import { Container, PageHero } from "@/components/ui";

export const metadata: Metadata = {
  title: "Proof of Commitment",
  description: "Look up any wallet's public savings record on Equalship, and use it onchain to filter farmed wallets.",
};

export default function ProofPage() {
  return (
    <>
      <PageHero
        eyebrow="Proof of Commitment"
        title={
          <>
            Farmed wallets are cheap. <span className="serif-accent text-brand-2">Savers</span> are not.
          </>
        }
        sub="Every Equalship payment updates a public onchain record. A wallet that has saved every week for a month is very hard to fake, so any app can use it to tell real people from farms."
      >
        <Link href="/developers" className="btn">
          Use it in a contract
        </Link>
      </PageHero>
      <Container className="py-12">
        <Suspense fallback={<div className="card h-48 animate-pulse" />}>
          <ProofLookup />
        </Suspense>
      </Container>
    </>
  );
}
