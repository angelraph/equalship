import type { Metadata } from "next";
import { DocPage } from "@/components/DocPage";
import { ADDR, EXPLORER, REPO } from "@/lib/chain";

export const metadata: Metadata = {
  title: "Security",
  description: "What protects your money in Equalship, what the contract can and cannot do, and how to check it yourself.",
};

const CAN = [
  "Take the exact USDG amount you approved for a save, keep 1%, and swap the rest into your basket with your wallet as the recipient.",
  "Hold your $WIF bond while you are a member and return it when you leave.",
  "Take part of a bond when a period closes unpaid, then burn half and share half with the members who paid.",
  "Burn the $WIF you choose to spend on a basket vote.",
];

const CANNOT = [
  "Move your Stock Tokens. It never holds them.",
  "Spend more than the amount you approved for an action.",
  "Raise the fee above 2%. That cap is in the contract code.",
  "Send a bond anywhere other than back to you, into a burn, or to the members of your circle.",
  "Slash anything in a circle with no slashing. Those bonds always come back in full.",
  "Save for you unless you turned auto-save on. Auto-save buys only into your own wallet.",
  "Be upgraded or replaced behind your back. There is no proxy.",
];

export default function SecurityPage() {
  return (
    <DocPage
      eyebrow="Security"
      title={
        <>
          Safe by design. <span className="serif-accent text-brand-2">Open</span> by choice.
        </>
      }
      sub="You should never have to trust a website. Here is exactly what the Equalship contract can do, what it cannot do, and how to check every claim yourself."
      aside={
        <>
          <div className="card">
            <p className="label">Official contract</p>
            <p className="mt-2 break-all font-mono text-sm">{ADDR.equalship || "Not configured"}</p>
            {ADDR.equalship && (
              <a className="btn mt-4 w-full" href={`${EXPLORER}/address/${ADDR.equalship}`} target="_blank" rel="noreferrer">
                Open on Blockscout
              </a>
            )}
            <p className="mt-3 text-xs text-muted">Before you sign, check that your wallet shows this address as the contract you are calling.</p>
          </div>
          {ADDR.equalship && (
            <div className="card">
              <p className="label">Verified source</p>
              <p className="mt-2 text-sm">
                <span className="text-up">Exact match</span> for both creation and runtime bytecode on Sourcify.
              </p>
              <a
                className="btn mt-4 w-full"
                href={`https://repo.sourcify.dev/4663/${ADDR.equalship}`}
                target="_blank"
                rel="noreferrer"
              >
                Read the verified code
              </a>
            </div>
          )}
          <div className="card">
            <p className="label">Source code</p>
            <a className="btn mt-3 w-full" href={REPO} target="_blank" rel="noreferrer">
              GitHub repository
            </a>
          </div>
        </>
      }
    >
      <h2>What the contract can do</h2>
      <ul>
        {CAN.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      <h2>What it cannot do</h2>
      <ul>
        {CANNOT.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>

      <h2>What your wallet will ask you</h2>
      <p>
        Connecting only shares your address. When you act, your wallet shows one of these and nothing else: an
        approval for the exact USDG or $WIF amount of that action, or a call to the Equalship contract above
        (createCircle, join, joinWithETH, joinFor, contribute, contributeWithETH, setAutoSave, slash, claim, leave, proposeBasket, vote, executeBasket). Equalship
        never asks for unlimited approvals, signatures of messages you cannot read, or your seed phrase. If you ever
        see a request that does not match this list, reject it.
      </p>

      <h2>About wallet warnings</h2>
      <p>
        Some wallet security scanners flag new sites that connect to wallets, especially on shared hosting domains,
        until the site has been reviewed. A warning is a reason to check, not proof of harm. Check that the contract
        address in your wallet matches the one on this page, that every approval is for the exact amount you expect,
        and that the code on GitHub matches what you are using.
      </p>

      <h2>How it was tested</h2>
      <ul>
        <li>Unit tests for every function, including slashing, rewards, voting and the burn.</li>
        <li>Fuzz tests that check a slash can never take more than the bond and that the contract always holds enough $WIF for every bond and reward it owes.</li>
        <li>Fork tests that run against real Robinhood Chain mainnet state and buy real Stock Tokens through the live Uniswap pools.</li>
        <li>A full dry run of the deploy and the first circle on a copy of mainnet before going live.</li>
      </ul>

      <h2>Known limits</h2>
      <ul>
        <li>The contract has not had a paid third party audit yet. Start small.</li>
        <li>The buyback is run by a keeper wallet so nobody can force a burn at a bad price. If the keeper stops, fees wait in the contract until it runs again. Fees can never be withdrawn by anyone.</li>
        <li>The owner can change the keeper and the fee, with the fee capped at 2%.</li>
        <li>Auto-save is run by the same keeper, only for members who turned it on, from the USDG they approved. Turn it off or remove the approval at any time.</li>
        <li>The $WIF pool is small, so large buybacks would move the price. The keeper uses a slippage limit.</li>
      </ul>

      <h2>Report a problem</h2>
      <p>
        Found a bug or something that looks wrong? Open an issue on <a href={`${REPO}/issues`} target="_blank" rel="noreferrer">GitHub</a>.
        For anything sensitive, open an issue asking for a private contact and do not post details publicly.
      </p>
    </DocPage>
  );
}
