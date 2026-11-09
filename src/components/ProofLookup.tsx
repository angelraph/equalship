"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { isAddress, type Address } from "viem";
import { isDeployed } from "@/lib/chain";
import { short, usd } from "@/lib/format";
import { ship, useNow } from "@/lib/hooks";
import { useAccount, useReadContract } from "@/lib/wallet";

const RULES = [
  { label: "Paid 4 periods", key: "paid" },
  { label: "Streak of 4", key: "streak" },
  { label: "Active in 8 days", key: "idle" },
] as const;

export function ProofLookup() {
  const { address } = useAccount();
  const params = useSearchParams();
  const [input, setInput] = useState(params.get("address") ?? "");
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

  const now = useNow();
  const checks = profile
    ? {
        paid: profile.totalPaid >= 4,
        streak: profile.bestStreak >= 4,
        idle: profile.lastPaidAt > 0n && now - Number(profile.lastPaidAt) <= 8 * 86_400,
      }
    : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="card space-y-5 p-7">
        <label className="block">
          <span className="label">Wallet</span>
          <input
            className="input mt-2 font-mono"
            placeholder={address ? "Your wallet, or paste any 0x address" : "Paste any 0x address"}
            value={input}
            onChange={(e) => setInput(e.target.value.trim())}
          />
        </label>
        {!isDeployed && <p className="text-sm text-warn">The contract address is not set for this site.</p>}
        {!target && <p className="text-sm text-muted">Connect a wallet or paste an address to see its record.</p>}
        {target && profile && (
          <>
            <p className="font-mono text-xs text-muted">Record for {short(target)}</p>
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
          </>
        )}
      </div>
      <div className={`card p-7 ${committed ? "border-up" : ""}`}>
        <p className="label">Committed saver check</p>
        <p className={`display mt-3 text-4xl ${committed ? "text-up" : ""}`}>
          {!target ? "No wallet yet" : committed ? "Committed saver" : "Not yet"}
        </p>
        <ul className="mt-6 space-y-3">
          {RULES.map((r) => {
            const ok = checks?.[r.key];
            return (
              <li key={r.key} className="flex items-center gap-3 text-sm">
                <span
                  className={`grid h-6 w-6 place-items-center rounded-full text-xs ${ok ? "bg-up-soft text-up" : "bg-card-2 text-muted"}`}
                >
                  {ok ? "✓" : "·"}
                </span>
                {r.label}
              </li>
            );
          })}
        </ul>
        <p className="mt-6 text-xs text-muted">
          This is the default rule, <span className="font-mono">isCommitted(wallet, 4, 4, 8 days)</span>. Any contract can
          call it with its own thresholds.
        </p>
      </div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card-2 p-3">
      <p className="font-mono text-lg font-semibold">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
