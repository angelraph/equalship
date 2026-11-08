import Link from "next/link";

const STEPS = [
  {
    t: "Start or join a circle",
    b: "A circle sets the amount (from 1 USDG), how often you pay, the $WIF bond, and a basket of up to five assets: Stock Tokens such as NVDA, AAPL, TSLA, MSFT, SPY and QQQ, or WETH.",
  },
  {
    t: "Bond $WIF",
    b: "Joining locks the circle's $WIF bond in the contract. You get it back when you leave, minus slashes. A friend can pay your bond for you, so someone with no $WIF can still join.",
  },
  {
    t: "Save every period",
    b: "Press save once per period. The contract takes your USDG, keeps a 1% fee for the burn, and swaps the rest on Uniswap into each basket asset. The output goes straight to your wallet. The contract never holds your stocks.",
  },
  {
    t: "Keep your streak",
    b: "Each paid period adds one to your streak. If a period closes without your payment, anyone can apply a slash: part of your bond, half burned and half shared with the members who paid.",
  },
  {
    t: "Vote on the basket",
    b: "Any member can propose a new basket. Members vote by burning $WIF. It passes if more $WIF is burned for it than against and at least half the members vote yes.",
  },
  {
    t: "Burn",
    b: "Fees from every contribution are swapped for $WIF on Uniswap and sent to the burn address. Every burn is a public transaction.",
  },
];

const FACTS = [
  ["Chain", "Robinhood Chain mainnet, chain id 4663"],
  ["Swaps", "Uniswap v3 SwapRouter02, USDG pools for each Stock Token"],
  ["Burn route", "USDG to WETH (0.05%) to $WIF (1%)"],
  ["Fee", "1% of each contribution, capped at 2% in the contract"],
  ["Custody", "None. Bought assets go to the member's wallet in the same transaction"],
  ["Source", "Public, MIT licensed, verified on Blockscout"],
];

export default function HowPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight">How Equalship works</h1>
        <p className="mt-3 text-muted">
          Saving is easier with people watching. Equalship gives a group of friends a shared goal, a real cost for
          skipping a week, and real ownership at the end of it.
        </p>
      </section>
      <ol className="space-y-4">
        {STEPS.map((s, i) => (
          <li key={s.t} className="card flex gap-4">
            <span className="font-mono text-sm text-muted">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <h2 className="font-semibold">{s.t}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">{s.b}</p>
            </div>
          </li>
        ))}
      </ol>
      <section className="card">
        <h2 className="font-semibold">Details</h2>
        <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm md:grid-cols-[160px_1fr]">
          {FACTS.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="card text-sm text-muted">
        <h2 className="font-semibold text-ink">Who can use Stock Tokens</h2>
        <p className="mt-2">
          Stock Tokens are not available to US persons and are restricted in some countries. Equalship asks you to
          confirm before a basket with Stock Tokens buys anything. Anyone can run a WETH basket instead.
        </p>
      </section>
      <Link href="/circles" className="btn btn-primary">
        Find a circle
      </Link>
    </div>
  );
}
