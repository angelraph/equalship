import Link from "next/link";
import { LiveStats } from "@/components/LiveStats";
import { Flywheel } from "@/components/Flywheel";

const FEATURES = [
  {
    title: "Circles",
    body: "Start a circle with friends. Everyone puts in the same USDG amount each week. It buys a basket of Stock Tokens straight into each member's own wallet. Equalship never holds your stocks.",
  },
  {
    title: "$WIF bond and streaks",
    body: "You join by bonding $WIF. Pay every week and your streak grows. Miss a week and part of your bond is slashed: half is burned, half goes to the members who kept saving.",
  },
  {
    title: "Basket vote",
    body: "Members choose next month's basket by burning $WIF as votes. Only bonded savers can vote, so fake wallets gain nothing.",
  },
  {
    title: "Proof of Commitment",
    body: "Every streak is public onchain. Any app can ask Equalship whether a wallet has saved for 4 weeks in a row, a cheap filter against farmed wallets.",
  },
];

export default function Home() {
  return (
    <div className="space-y-20">
      <section className="grid gap-10 pt-6 md:grid-cols-[1.2fr_1fr] md:items-center">
        <div>
          <p className="pill mb-5">Live on Robinhood Chain</p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
            Save together.
            <br />
            <span className="text-save">Own together.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            Equalship turns a group chat into a savings circle. Put in $5 or more each week with friends, own a slice of
            NVIDIA, Apple or the S&amp;P 500, and keep each other honest with a $WIF bond.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/circles" className="btn btn-primary px-5 py-3 text-base">
              Start or join a circle
            </Link>
            <Link href="/how" className="btn px-5 py-3 text-base">
              How it works
            </Link>
          </div>
        </div>
        <Flywheel />
      </section>

      <LiveStats />

      <section>
        <h2 className="text-2xl font-semibold tracking-tight">One habit, four parts</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="card">
              <p className="font-mono text-xs text-muted">0{i + 1}</p>
              <h3 className="mt-2 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card grid gap-6 md:grid-cols-3">
        <div>
          <p className="label">Why $WIF</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Demand that comes from saving, not betting</h2>
        </div>
        <ul className="space-y-3 text-sm text-muted md:col-span-2">
          <li>
            <b className="text-ink">Bond.</b> Every member locks $WIF for as long as they save. More savers means more
            $WIF locked.
          </li>
          <li>
            <b className="text-ink">Burn on every contribution.</b> A 1% fee on each contribution buys $WIF on Uniswap
            and sends it to the burn address. The more people save, the more $WIF burns.
          </li>
          <li>
            <b className="text-ink">Burn on every missed week.</b> Half of each slash is burned, the other half rewards
            the people who stayed.
          </li>
          <li>
            <b className="text-ink">Burn on every vote.</b> Basket votes work like World is Fair: 1 $WIF is 1 vote,
            and it is burned.
          </li>
        </ul>
      </section>
    </div>
  );
}
