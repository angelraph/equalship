import type { Metadata } from "next";
import { DocPage } from "@/components/DocPage";

export const metadata: Metadata = { title: "Privacy", description: "What Equalship collects (almost nothing) and what is public onchain." };

export default function PrivacyPage() {
  return (
    <DocPage eyebrow="Legal" title="Privacy" sub="Short version: we do not run accounts, cookies or trackers." updated="9 November 2026">
      <h2>What we collect</h2>
      <p>
        Nothing that identifies you. There are no sign ups, no emails, no analytics scripts and no advertising cookies.
        Our hosting provider keeps standard server logs, such as IP addresses and request times, for security and
        reliability.
      </p>
      <h2>What stays in your browser</h2>
      <ul>
        <li>The wallet you chose last, so we can reconnect without a popup.</li>
        <li>Your light or dark theme.</li>
        <li>Your Stock Token eligibility confirmation.</li>
      </ul>
      <p>These live in your browser storage only. Clear it at any time.</p>
      <h2>What is public onchain</h2>
      <p>
        Everything you do with the contract is a public blockchain transaction: your wallet address, the circles you
        join, your payments, streaks, slashes and votes. That is how the system stays verifiable. Anyone can read it,
        and it cannot be deleted.
      </p>
      <h2>Third parties</h2>
      <p>
        Price data comes from the Robinhood Chain pricing API and DexPaprika, requested by our server, not your
        browser. Your wallet and the Robinhood Chain RPC provider see the requests your browser sends them.
      </p>
    </DocPage>
  );
}
