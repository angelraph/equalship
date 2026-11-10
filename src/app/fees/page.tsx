import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHero } from "@/components/ui";

export const metadata: Metadata = { title: "Fees", description: "Equalship has one fee: 1% of each contribution, and all of it buys and burns $WIF." };

const ROWS = [
  { what: "Saving (contribute)", fee: "1% of the contribution", goes: "Buys $WIF and burns it" },
  { what: "Creating or joining a circle", fee: "None", goes: "Your bond is held, not charged" },
  { what: "Leaving a circle", fee: "None", goes: "Your bond comes back, in full in no-slash circles" },
  { what: "Missing a period", fee: "Nothing in no-slash circles. Otherwise the slash rate, after a grace window", goes: "Half burned, half to members who paid" },
  { what: "Paying with ETH", fee: "The Uniswap pool fee for the ETH swap", goes: "Liquidity providers, any extra comes back to you" },
  { what: "Basket vote", fee: "The $WIF you choose to spend", goes: "Burned" },
  { what: "Uniswap swap", fee: "The pool fee, 0.01% to 0.3%", goes: "Liquidity providers" },
  { what: "Network gas", fee: "A few cents in ETH", goes: "Robinhood Chain" },
];

export default function FeesPage() {
  return (
    <>
      <PageHero
        eyebrow="Fees"
        title={
          <>
            One fee. <span className="serif-accent text-brand-2">All</span> of it burns.
          </>
        }
        sub="Equalship takes 1% of each contribution and nothing else. That 1% is never paid to anyone: it buys $WIF on Uniswap and burns it, lowering the total supply."
      />
      <Container className="py-14">
        <div className="overflow-x-auto rounded-3xl border border-line bg-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="px-6 py-4 font-medium">Action</th>
                <th className="px-6 py-4 font-medium">Cost</th>
                <th className="px-6 py-4 font-medium">Where it goes</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.what} className="border-b border-line last:border-0">
                  <td className="px-6 py-4 font-semibold">{r.what}</td>
                  <td className="px-6 py-4 font-mono">{r.fee}</td>
                  <td className="px-6 py-4 text-muted">{r.goes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <div className="card">
            <p className="label">Example</p>
            <p className="mt-2 text-sm text-muted">You save $10. $0.10 goes to the burn pool and $9.90 buys your basket, straight into your wallet.</p>
          </div>
          <div className="card">
            <p className="label">Hard cap</p>
            <p className="mt-2 text-sm text-muted">The contract refuses any fee above 2%. Changing it is a public transaction.</p>
          </div>
          <div className="card">
            <p className="label">No hidden spread</p>
            <p className="mt-2 text-sm text-muted">Swaps run at the live pool price with a slippage limit you can see before you sign.</p>
          </div>
        </div>
        <p className="mt-8 text-sm text-muted">
          See the burn as it happens on the <Link className="link" href="/wif">$WIF page</Link>.
        </p>
      </Container>
    </>
  );
}
