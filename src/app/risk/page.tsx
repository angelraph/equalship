import type { Metadata } from "next";
import { DocPage } from "@/components/DocPage";

export const metadata: Metadata = { title: "Risk disclosure", description: "The risks of using Equalship, Stock Tokens and $WIF, in plain words." };

const RISKS = [
  ["Market risk", "Stock Tokens, ETFs, Ether and $WIF go up and down. The value of what you own can fall below what you put in."],
  ["Stock Token terms", "Stock Tokens are debt securities issued by Robinhood Assets (Jersey) Limited. They track shares but do not give shareholder or voting rights. They are not available to US persons and are restricted in some countries."],
  ["Slashing", "If you miss a period, part of your $WIF bond is taken. Missing enough periods can take the whole bond."],
  ["$WIF", "$WIF is a community token with no promise of value or return. Its price can move sharply and its market is small."],
  ["Smart contract risk", "The contract is tested but has not had a paid audit. A bug could cause loss of funds."],
  ["Liquidity and slippage", "Swaps run against Uniswap pools. Thin pools can give worse prices. Your save fails instead of filling if the price moves past the slippage limit."],
  ["Oracle and data", "Prices on this website can lag or be unavailable. They are for information only."],
  ["Network risk", "Robinhood Chain is a young network with a single sequencer run by Robinhood. Outages can delay transactions."],
  ["Keys and wallets", "If you lose your keys, nobody can recover your assets. Signing a malicious transaction from another site can drain your wallet."],
  ["Regulation", "Rules for tokens and tokenized assets are changing and can affect what you are allowed to hold."],
];

export default function RiskPage() {
  return (
    <DocPage
      eyebrow="Legal"
      title="Risk disclosure"
      sub="Please read this before you save. Only put in money you can afford to lose."
      updated="9 November 2026"
    >
      <div className="mt-2 grid gap-3">
        {RISKS.map(([t, d]) => (
          <div key={t} className="rounded-3xl border border-line bg-card p-5">
            <h3 className="!mt-0 font-semibold text-ink">{t}</h3>
            <p className="mt-1">{d}</p>
          </div>
        ))}
      </div>
      <p className="mt-8">Nothing on this website is investment, legal or tax advice.</p>
    </DocPage>
  );
}
