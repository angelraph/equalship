import type { Metadata } from "next";
import { DocPage } from "@/components/DocPage";

export const metadata: Metadata = { title: "Terms", description: "Terms of use for the Equalship website and contracts." };

export default function TermsPage() {
  return (
    <DocPage eyebrow="Legal" title="Terms of use" updated="9 November 2026">
      <h2>What Equalship is</h2>
      <p>
        Equalship is open source software: a website and a smart contract on Robinhood Chain that let groups of people
        run savings circles. The website is an interface. The contract runs on a public blockchain and does what its
        code says, whether or not this website is online.
      </p>
      <h2>What Equalship is not</h2>
      <p>
        Equalship is not a bank, a broker, an exchange, a custodian or an investment adviser. It does not hold your
        Stock Tokens, does not give advice, and does not manage money on your behalf. Nothing on this website is an
        offer or a recommendation to buy or sell any asset.
      </p>
      <h2>Your responsibilities</h2>
      <ul>
        <li>You are at least 18 years old and allowed to use these services where you live.</li>
        <li>You are not a US person and not in a restricted region if you buy Stock Tokens, and you follow any rules that apply to you.</li>
        <li>You keep your wallet and keys safe. Nobody can recover them for you.</li>
        <li>You read every transaction before you sign it.</li>
        <li>You understand that blockchain transactions are final.</li>
      </ul>
      <h2>Risk</h2>
      <p>
        Prices move and you can lose money. Smart contracts can have bugs. Read the risk disclosure before you use the
        service.
      </p>
      <h2>No warranty</h2>
      <p>
        The software is provided as is, without warranty of any kind, under the MIT license. To the extent the law
        allows, the people who build Equalship are not liable for losses that come from using it.
      </p>
      <h2>Trademarks</h2>
      <p>
        Equalship is independent and is not affiliated with, endorsed by, or sponsored by Robinhood Markets, Inc. or
        World is Flat. Other names belong to their owners.
      </p>
      <h2>Changes</h2>
      <p>These terms may change. The date at the top shows the latest version.</p>
    </DocPage>
  );
}
