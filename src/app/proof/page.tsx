"use client";

import { useState } from "react";
import { isAddress, type Address } from "viem";
import { useAccount, useReadContract } from "@/lib/wallet";
import { ADDR, isDeployed } from "@/lib/chain";
import { usd } from "@/lib/format";
import { ship } from "@/lib/hooks";

const SNIPPET = `interface IEqualship {
  function isCommitted(
    address account,
    uint32 minPaid,    // periods paid in total
    uint32 minStreak,  // best streak reached
    uint64 maxIdle     // seconds since last payment
  ) external view returns (bool);
}

// Only count votes from wallets that saved 4 periods in a row
// and paid within the last 8 days.
require(
  IEqualship(EQUALSHIP).isCommitted(voter, 4, 4, 8 days),
  "not a committed saver"
);`;

export default function ProofPage() {
  const { address } = useAccount();
  const [input, setInput] = useState("");
  const target = (isAddress(input) ? input : address) as Address | undefined;

  const { data: profile } = useReadContract({
    ...ship,
    functionName: "profileOf",
    args: target ? [target] : undefined,
    query: { enabled: isDeployed && !!target },
  });
  const { data: committed } = useReadContract({
    ...ship,
    functionName: "isCommitted",
    args: target ? [target, 4, 4, BigInt(8 * 86_400)] : undefined,
    query: { enabled: isDeployed && !!target },
  });

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight">Proof of Commitment</h1>
        <p className="mt-3 text-muted">
          Farmed wallets are cheap. A wallet that has put real money in every week for a month is not. Every Equalship
          payment updates a public onchain profile that any contract or app can read for free.
        </p>
        <p className="mt-3 text-muted">
          World is Fair checks for farmed votes offchain after voting closes. With Equalship, a vote can require a
          committed saver at the moment it is cast.
        </p>

        <div className="card mt-6 space-y-4">
          <input
            className="input font-mono"
            placeholder={address ? `Your wallet, or paste another 0x address` : "Paste a 0x address"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          {!isDeployed && <p className="text-sm text-warn">The contract address is not set for this site.</p>}
          {target && profile && (
            <>
              <div className="grid grid-cols-3 gap-3 text-center">
                <Tile label="Paid" value={profile.totalPaid.toString()} />
                <Tile label="Best streak" value={profile.bestStreak.toString()} />
                <Tile label="Missed" value={profile.missed.toString()} />
                <Tile label="Saved" value={usd(profile.totalSaved)} />
                <Tile label="Circles" value={profile.circlesJoined.toString()} />
                <Tile
                  label="Last paid"
                  value={profile.lastPaidAt ? new Date(Number(profile.lastPaidAt) * 1000).toLocaleDateString() : "never"}
                />
              </div>
              <p className={`rounded-lg p-3 text-sm ${committed ? "bg-save-soft text-save" : "bg-paper text-muted"}`}>
                {committed
                  ? "Committed saver: 4 periods paid, a streak of 4, and active in the last 8 days."
                  : "Not yet a committed saver by the 4 / 4 / 8 days rule."}
              </p>
            </>
          )}
        </div>
      </section>
      <section>
        <h2 className="label mb-2">For builders</h2>
        <pre className="card overflow-x-auto font-mono text-xs leading-relaxed">{SNIPPET}</pre>
        <p className="mt-3 text-sm text-muted">
          Contract: <span className="font-mono">{ADDR.equalship || "not deployed yet"}</span> on Robinhood Chain (4663).
          Also readable: <span className="font-mono">profileOf(address)</span> for the raw numbers.
        </p>
      </section>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-paper p-3">
      <p className="font-mono text-lg font-semibold">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
