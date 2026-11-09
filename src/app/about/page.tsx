import type { Metadata } from "next";
import Link from "next/link";
import { DocPage } from "@/components/DocPage";

export const metadata: Metadata = {
  title: "About",
  description: "Why Equalship exists: the oldest way to save, rebuilt so that anyone, anywhere, can own a piece of the world's companies.",
};

export default function AboutPage() {
  return (
    <DocPage
      eyebrow="About"
      title={
        <>
          The oldest way to save, for the <span className="serif-accent text-brand-2">newest</span> markets
        </>
      }
      sub="Where you are born should not decide what you get to own."
    >
      <h2>Why we built it</h2>
      <p>
        Most people never start investing. The first step is lonely and easy to put off, and the best assets have
        always sat behind borders, minimums and paperwork. Savings circles solved the first problem generations ago in
        places that banks ignored: you save because your group expects you to. Robinhood Chain is starting to solve
        the second, with Stock Tokens that anyone in an eligible region can hold in a wallet.
      </p>
      <p>Equalship puts the two together. Equal access, shared ownership: equal ship.</p>

      <h2>What we believe</h2>
      <ul>
        <li>Saving should be social, because habits stick when other people are watching.</li>
        <li>You should hold what you buy. A savings product that never touches your assets cannot lose them.</li>
        <li>Rules should be code that anyone can read, not terms that only a lawyer can.</li>
        <li>A token should have a job. $WIF here locks commitment, rewards the people who stay and burns with every save.</li>
      </ul>

      <h2>Where it comes from</h2>
      <p>
        Equalship was built for the World is Flat hackathon on Robinhood Chain, whose thesis is that the world is flat:
        everyone should get the same chance to build and to own. It is independent and is not affiliated with Robinhood
        Markets, Inc.
      </p>

      <h2>What comes next</h2>
      <ul>
        <li>Reminders before a period closes, so nobody loses a streak by accident.</li>
        <li>Gas free saving through sponsored transactions, so newcomers only need USDG.</li>
        <li>Rotating payouts for circles that want the classic tontine model next to shared ownership.</li>
        <li>Integrations that let other apps use Proof of Commitment.</li>
      </ul>
      <p>
        Ready to try it? <Link href="/circles">Find a circle</Link> or read <Link href="/how">how it works</Link>.
      </p>
    </DocPage>
  );
}
