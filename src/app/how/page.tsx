import type { Metadata } from "next";
import Link from "next/link";
import { Container, Icon, PageHero, SectionHead } from "@/components/ui";

export const metadata: Metadata = {
  title: "How it works",
  description: "How an Equalship savings circle works, from the first save to leaving with your bond.",
};

const STEPS = [
  {
    icon: "users",
    t: "Start or join a circle",
    b: "A circle sets the amount (from 1 USDG), how often you pay (hourly for demos, daily, weekly or every two weeks), the $WIF bond, the slash rate, and a basket of up to five assets such as NVDA, AAPL, TSLA, MSFT, SPY, QQQ or WETH.",
  },
  {
    icon: "lock",
    t: "Bond $WIF",
    b: "Joining locks the circle's bond in the contract. It comes back when you leave, minus slashes. A friend can pay your bond with Sponsor a friend, so someone with no $WIF can still start.",
  },
  {
    icon: "wallet",
    t: "Save every period",
    b: "Press save once per period. The contract takes your USDG, keeps 1% for the burn, and swaps the rest on Uniswap into each basket asset. The output goes straight to your wallet in the same transaction.",
  },
  {
    icon: "clock",
    t: "Keep your streak",
    b: "Each paid period adds one to your streak. When a period closes unpaid, anyone can apply a slash: part of the bond, half burned and half shared with the members who paid.",
  },
  {
    icon: "vote",
    t: "Vote on the basket",
    b: "Any member can propose a new basket. Members vote by burning $WIF. It passes if more $WIF is burned for it than against and at least half the members vote yes.",
  },
  {
    icon: "flame",
    t: "Burn",
    b: "Every day the fee pool is swapped for $WIF on Uniswap and sent to the burn address. Every burn is a public transaction.",
  },
];

const FACTS = [
  ["Chain", "Robinhood Chain mainnet, chain id 4663"],
  ["Swaps", "Uniswap v3 SwapRouter02, USDG pools for each asset"],
  ["Burn route", "USDG to WETH (0.05%) to $WIF (1%)"],
  ["Fee", "1% of each contribution, capped at 2% in the contract"],
  ["Custody", "None. Bought assets go to the member's wallet in the same transaction"],
  ["Source", "Public on GitHub, MIT license"],
];

export default function HowPage() {
  return (
    <>
      <PageHero
        eyebrow="How it works"
        title={
          <>
            Saving is easier with people <span className="serif-accent text-brand-2">watching</span>
          </>
        }
        sub="Equalship gives a group a shared goal, a real cost for skipping a week, and real ownership at the end of it."
      >
        <Link href="/circles" className="btn btn-primary">
          Find a circle
        </Link>
        <Link href="/faq" className="btn">
          Read the FAQ
        </Link>
      </PageHero>
      <Container className="py-14">
        <ol className="relative space-y-5 before:absolute before:bottom-6 before:left-[27px] before:top-6 before:w-px before:bg-line">
          {STEPS.map((s, i) => (
            <li key={s.t} className="relative flex gap-5">
              <span className="z-10 grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-line bg-card text-brand-2">
                <Icon name={s.icon} className="h-6 w-6" />
              </span>
              <div className="card flex-1">
                <p className="label">Step {i + 1}</p>
                <h2 className="display mt-2 text-2xl">{s.t}</h2>
                <p className="mt-2 leading-relaxed text-muted">{s.b}</p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
      <Container className="pb-10">
        <SectionHead align="left" eyebrow="Details" title="Under the hood" />
        <dl className="card mt-8 grid gap-x-8 gap-y-4 text-sm md:grid-cols-[200px_1fr]">
          {FACTS.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </>
  );
}
