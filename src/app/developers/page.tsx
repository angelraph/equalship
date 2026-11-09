import type { Metadata } from "next";
import { DocPage } from "@/components/DocPage";
import { ADDR, ASSETS, EXPLORER, REPO } from "@/lib/chain";

export const metadata: Metadata = {
  title: "Developers",
  description: "Equalship contract addresses, functions, events and the Proof of Commitment registry for builders on Robinhood Chain.",
};

const SNIPPET = `interface IEqualship {
  function isCommitted(
    address account,
    uint32 minPaid,    // periods paid in total
    uint32 minStreak,  // best streak reached
    uint64 maxIdle     // seconds since last payment
  ) external view returns (bool);
}

// only count wallets that saved 4 periods in a row
// and paid within the last 8 days
require(
  IEqualship(EQUALSHIP).isCommitted(voter, 4, 4, 8 days),
  "not a committed saver"
);`;

const FUNCTIONS = [
  ["createCircle(name, contribution, bond, period, maxMembers, slashBps, legs)", "Start a circle and join it as the first member."],
  ["join(circleId) / joinFor(circleId, member)", "Bond $WIF to join, or pay a friend's bond."],
  ["contribute(circleId, minOuts)", "Save for this period. Buys every basket leg into the caller's wallet."],
  ["slash(circleId, member)", "Settle missed periods for any member. Anyone can call it."],
  ["claim(circleId) / leave(circleId)", "Take shared rewards, or leave with the rest of your bond."],
  ["proposeBasket / vote / executeBasket", "Change the basket by burning $WIF as votes."],
  ["profileOf(account) / isCommitted(...)", "The public Proof of Commitment registry."],
  ["buyAndBurn(path, amountIn, minWifOut)", "Keeper only. Swaps the fee pool for $WIF and burns it."],
];

const EVENTS = ["CircleCreated", "Joined", "Contributed", "Bought", "Slashed", "RewardClaimed", "Left", "BasketProposed", "Voted", "BasketChanged", "FeeBurned"];

export default function DevelopersPage() {
  return (
    <DocPage
      eyebrow="Developers"
      title={
        <>
          Build on <span className="serif-accent text-brand-2">who really saves</span>
        </>
      }
      sub="Equalship is one open contract on Robinhood Chain. Read circles, follow events, or use the Proof of Commitment registry as a cheap filter against farmed wallets."
      aside={
        <div className="card">
          <p className="label">Addresses</p>
          <dl className="mt-3 space-y-3 text-xs">
            {[
              ["Equalship", ADDR.equalship || "not set"],
              ["USDG", ADDR.usdg],
              ["$WIF", ADDR.wif],
              ["SwapRouter02", ADDR.router],
              ["QuoterV2", ADDR.quoter],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-muted">{k}</dt>
                <dd>
                  <a className="link break-all font-mono" href={`${EXPLORER}/address/${v}`} target="_blank" rel="noreferrer">
                    {v}
                  </a>
                </dd>
              </div>
            ))}
          </dl>
          <a className="btn mt-5 w-full" href={REPO} target="_blank" rel="noreferrer">
            Source on GitHub
          </a>
        </div>
      }
    >
      <h2>Proof of Commitment</h2>
      <p>
        Every save updates a public profile per wallet: periods paid, best streak, missed periods, total saved, circles
        joined, first and last payment. A month of real weekly payments is expensive to fake, which makes this a strong
        signal for votes, airdrops, allowlists and reputation.
      </p>
      <pre className="not-prose mt-4 overflow-x-auto rounded-3xl border border-line bg-card p-5 font-mono text-xs leading-relaxed text-ink">{SNIPPET}</pre>

      <h2>Functions</h2>
      <div className="not-prose mt-4 divide-y divide-line rounded-3xl border border-line bg-card">
        {FUNCTIONS.map(([f, d]) => (
          <div key={f} className="px-5 py-4">
            <p className="font-mono text-xs text-brand-2">{f}</p>
            <p className="mt-1 text-sm text-muted">{d}</p>
          </div>
        ))}
      </div>

      <h2>Events</h2>
      <p>Index these to follow every circle in real time:</p>
      <p className="font-mono text-xs">{EVENTS.join(", ")}</p>

      <h2>Basket legs</h2>
      <p>
        A leg is a token, a weight in basis points and a Uniswap v3 path that starts with USDG and ends with the token.
        These are the routes the app uses:
      </p>
      <ul>
        {ASSETS.filter((a) => a.basket).map((a) => (
          <li key={a.symbol}>
            {a.symbol}: USDG to {a.symbol} at the {a.fee / 10_000}% fee tier
          </li>
        ))}
      </ul>

      <h2>Run it yourself</h2>
      <p>
        The repository has the Foundry project, a mainnet fork test and the scripts used to deploy and to create the first
        circle. Clone it, run the tests, and read the README for every command.
      </p>
    </DocPage>
  );
}
