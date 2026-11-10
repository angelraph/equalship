import type { Metadata } from "next";
import Link from "next/link";
import { FairChecker } from "@/components/FairChecker";
import { Container, Icon, PageHero, SectionHead } from "@/components/ui";

export const metadata: Metadata = {
  title: "Stop vote farming",
  description: "How World is Fair, or any $WIF vote, can count only committed savers, using Equalship's public Proof of Commitment.",
};

const API = `GET https://equalship.vercel.app/api/commitment/0xWALLET?paid=4&streak=4&idleDays=8

{
  "committed": true,
  "rule": { "minPaid": 4, "minStreak": 4, "maxIdleDays": 8 },
  "record": { "periodsPaid": 6, "bestStreak": 6, "missed": 0, ... }
}`;

const SOLIDITY = `// count a vote only from a committed saver
require(
  IEqualship(EQUALSHIP).isCommitted(voter, 4, 4, 8 days),
  "not a committed saver"
);`;

const STEPS = [
  {
    icon: "eye",
    t: "Today",
    b: "One wallet and 1 $WIF is one vote. Farmed wallets are filtered offchain after voting closes, so the count is only final once that check has run.",
  },
  {
    icon: "check",
    t: "With Equalship",
    b: "Each vote can be checked the moment it is cast: has this wallet put real money into a savings circle for weeks in a row? Farms cannot fake a month of weekly saves cheaply.",
  },
  {
    icon: "shield",
    t: "Nothing to trust",
    b: "The record lives onchain, the rule is a public function, and the thresholds are yours to pick. Use the contract, the JSON API, or paste a list below.",
  },
];

export default function FairPage() {
  return (
    <>
      <PageHero
        eyebrow="For World is Fair"
        title={
          <>
            Count <span className="serif-accent text-brand-2">real</span> voters, not farms
          </>
        }
        sub="Every Equalship save builds a public, onchain savings record. Any $WIF vote can ask one question before counting a wallet: is this a committed saver?"
      >
        <a className="btn btn-primary" href="#check">
          Check wallets
        </a>
        <Link href="/developers" className="btn">
          Developer docs
        </Link>
      </PageHero>
      <Container className="py-14">
        <div className="grid gap-5 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.t} className="card">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-soft text-brand-2">
                <Icon name={s.icon} />
              </span>
              <h2 className="display mt-5 text-xl">{s.t}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.b}</p>
            </div>
          ))}
        </div>
      </Container>
      <Container className="py-6" >
        <div id="check" className="scroll-mt-24">
          <SectionHead align="left" eyebrow="Live check" title="Paste voter wallets" sub="One address per line, up to 200. Reads the Equalship contract on Robinhood Chain." />
          <div className="mt-8">
            <FairChecker />
          </div>
        </div>
      </Container>
      <Container className="grid grid-cols-[minmax(0,1fr)] gap-5 py-14 lg:grid-cols-2">
        <div>
          <p className="label mb-2">JSON API</p>
          <pre className="card overflow-x-auto font-mono text-xs leading-relaxed">{API}</pre>
        </div>
        <div>
          <p className="label mb-2">In a contract</p>
          <pre className="card overflow-x-auto font-mono text-xs leading-relaxed">{SOLIDITY}</pre>
        </div>
      </Container>
    </>
  );
}
