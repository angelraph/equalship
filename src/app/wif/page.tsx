import type { Metadata } from "next";
import Link from "next/link";
import { WifLive } from "@/components/WifLive";
import { Container, Icon, PageHero, SectionHead } from "@/components/ui";
import { ADDR, EXPLORER } from "@/lib/chain";

export const metadata: Metadata = {
  title: "$WIF in Equalship",
  description: "How Equalship puts $WIF to work: bonds lock it, missed weeks burn it, votes burn it, and fees buy it back and burn it.",
};

const LOOP = [
  { icon: "lock", title: "Bond", body: "Joining a circle locks the circle's $WIF bond for as long as you stay." },
  { icon: "wallet", title: "Save", body: "Each save keeps a 1% fee in USDG for the buyback." },
  { icon: "flame", title: "Buy and burn", body: "Every day the fee pool buys $WIF on Uniswap and burns it, so the total supply goes down." },
  { icon: "users", title: "Slash", body: "A missed period burns half of the penalty and pays the other half to those who stayed." },
  { icon: "vote", title: "Vote", body: "Basket votes cost $WIF and every vote is burned." },
  { icon: "check", title: "Proof", body: "Long streaks become public proof that other apps can trust." },
];

export default function WifPage() {
  return (
    <>
      <PageHero
        eyebrow="$WIF"
        title={
          <>
            The bond, the vote and the <span className="serif-accent text-burn">burn</span>
          </>
        }
        sub="Most uses of $WIF on Robinhood Chain are a stake in a bet. In Equalship, $WIF is the cost of quitting and the reward for staying, and it is removed from supply every time people save."
      >
        <a className="btn" href={`${EXPLORER}/token/${ADDR.wif}`} target="_blank" rel="noreferrer">
          $WIF on Blockscout
        </a>
        <Link href="/markets/wif" className="btn">
          $WIF price
        </Link>
      </PageHero>
      <Container className="py-12">
        <WifLive />
      </Container>
      <section className="py-12">
        <Container>
          <SectionHead eyebrow="The loop" title="Every part of a circle touches $WIF" />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {LOOP.map((s, i) => (
              <div key={s.title} className="card">
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-soft text-brand-2">
                    <Icon name={s.icon} />
                  </span>
                  <span className="font-mono text-xs text-muted">0{i + 1}</span>
                </div>
                <h3 className="display mt-6 text-xl">{s.title}</h3>
                <p className="mt-2 text-sm text-muted">{s.body}</p>
              </div>
            ))}
          </div>
          <div className="panel mt-10 p-8 md:p-10">
            <h3 className="display text-2xl">Why this flywheel holds up</h3>
            <p className="mt-3 max-w-3xl text-muted">
              Demand for $WIF here does not depend on someone losing a bet. It grows with the number of people saving and
              how often they save. Saving is a weekly habit, so the burn is too. The more circles there are, the more
              $WIF is locked in bonds, and the more streaks there are, the more valuable the Proof of Commitment record
              becomes to other apps, which brings in more savers.
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}
