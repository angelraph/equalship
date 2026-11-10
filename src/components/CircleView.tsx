"use client";

import { useState } from "react";
import { isAddress, type Address } from "viem";
import { useAccount, usePublicClient, useReadContract, useReadContracts, useWriteContract } from "@/lib/wallet";
import { erc20Abi } from "@/lib/abis";
import { ADDR, EXPLORER, assetByAddress, isDeployed, periodLabel } from "@/lib/chain";
import { countdown, short, usd, wifFmt } from "@/lib/format";
import { ship, useCircle, useNow } from "@/lib/hooks";
import { useTx } from "@/lib/useTx";
import { BasketVote } from "./BasketVote";
import { TxStatus } from "./TxStatus";
import { YourPanel } from "./YourPanel";

export function CircleView({ id }: { id: bigint }) {
  const { address } = useAccount();
  const { data, isLoading } = useCircle(id);
  const now = useNow();

  const { data: memberList } = useReadContract({ ...ship, functionName: "members", args: [id], query: { enabled: isDeployed } });
  const { data: period } = useReadContract({ ...ship, functionName: "currentPeriod", args: [id], query: { enabled: isDeployed } });

  const list = (memberList ?? []) as Address[];
  const { data: rows } = useReadContracts({
    contracts: list.flatMap((m) => [
      { ...ship, functionName: "getMember" as const, args: [id, m] as const },
      { ...ship, functionName: "missedPeriods" as const, args: [id, m] as const },
    ]),
    query: { enabled: list.length > 0 },
  });

  if (!isDeployed) return <p className="card text-warn">The Equalship contract address is not set for this site.</p>;
  if (isLoading) return <div className="card h-64 animate-pulse" />;
  if (!data) return <p className="card">Circle #{id.toString()} does not exist.</p>;

  const [c, legs] = data;
  const p = period ?? 0n;
  const end = Number(c.start) + (Number(p) + 1) * c.period;

  const members = list
    .map((addr, i) => {
      const m = rows?.[i * 2];
      const miss = rows?.[i * 2 + 1];
      return {
        addr,
        m: m?.status === "success" ? (m.result as MemberRow["m"]) : undefined,
        missed: miss?.status === "success" ? (miss.result as bigint) : 0n,
      };
    })
    .filter((r) => r.m?.active || (r.m && r.m.paidCount > 0));

  const me = members.find((r) => r.addr.toLowerCase() === address?.toLowerCase());

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-muted">Circle #{id.toString()}</p>
          <h1 className="display mt-1 text-5xl">{c.name}</h1>
          <p className="mt-2 text-muted">
            {usd(c.contribution)} every {periodLabel(c.period)}. Bond {wifFmt(c.bond)} $WIF.{" "}
            {c.slashBps === 0
              ? "No slashing: the bond always comes back in full when you leave."
              : `Missing a ${periodLabel(c.period)} past the grace window costs ${c.slashBps / 100}% of the bond.`}
          </p>
        </div>
        <div className="card py-3 text-right">
          <p className="label">Period {p.toString()} closes in</p>
          <p className="font-mono text-2xl font-semibold">{countdown(end - now)}</p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <Stat label="Members" value={`${c.memberCount} / ${c.maxMembers}`} />
        <Stat label="Saved together" value={usd(c.totalSaved)} />
        <Stat label="$WIF bonded" value={wifFmt(BigInt(c.memberCount) * c.bond)} />
        <div className="card">
          <p className="label">Basket</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {legs.map((l) => (
              <span key={l.token} className="pill">
                <b>{assetByAddress(l.token)?.symbol ?? short(l.token)}</b> {l.weightBps / 100}%
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-6">
          <MembersTable id={id} rows={members} currentPeriod={p} noSlash={c.slashBps === 0} />
          <BasketVote id={id} circle={c} isMember={!!me?.m?.active} />
        </section>
        <aside className="space-y-4">
          <YourPanel id={id} circle={c} legs={legs} me={me?.m} />
          <InvitePanel id={id} bond={c.bond} />
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <p className="label">{label}</p>
      <p className="mt-2 font-mono text-xl font-semibold">{value}</p>
    </div>
  );
}

type MemberRow = {
  addr: Address;
  m?: {
    active: boolean;
    nextDue: bigint;
    streak: number;
    bestStreak: number;
    paidCount: number;
    missedCount: number;
    bondLeft: bigint;
    saved: bigint;
  };
  missed: bigint;
};

function MembersTable({
  id,
  rows,
  currentPeriod,
  noSlash,
}: {
  id: bigint;
  rows: MemberRow[];
  currentPeriod: bigint;
  noSlash: boolean;
}) {
  const { writeContractAsync } = useWriteContract();
  const { state, run } = useTx();
  const sorted = [...rows].sort((a, b) => (b.m?.streak ?? 0) - (a.m?.streak ?? 0));

  return (
    <div className="card overflow-x-auto">
      <h2 className="mb-3 font-semibold">Members</h2>
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="text-left text-muted">
            <th className="pb-2 font-medium">Member</th>
            <th className="pb-2 font-medium">Streak</th>
            <th className="pb-2 font-medium">Paid</th>
            <th className="pb-2 font-medium">Saved</th>
            <th className="pb-2 font-medium">Bond left</th>
            <th className="pb-2 font-medium">This period</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(({ addr, m, missed }) => {
            if (!m) return null;
            const paidNow = m.nextDue > currentPeriod;
            return (
              <tr key={addr} className="border-t border-line">
                <td className="py-2 font-mono text-xs">
                  <a className="link" href={`${EXPLORER}/address/${addr}`} target="_blank" rel="noreferrer">
                    {short(addr)}
                  </a>
                </td>
                <td className="py-2 font-mono">{m.streak}</td>
                <td className="py-2 font-mono">{m.paidCount}</td>
                <td className="py-2 font-mono">{usd(m.saved)}</td>
                <td className="py-2 font-mono">{wifFmt(m.bondLeft)}</td>
                <td className="py-2">
                  {!m.active ? (
                    <span className="pill">left</span>
                  ) : missed > 0n ? (
                    <button
                      className="pill border-burn text-burn"
                      onClick={() =>
                        run([
                          {
                            label: "Apply slash",
                            send: () => writeContractAsync({ ...ship, functionName: "slash", args: [id, addr] }),
                          },
                        ])
                      }
                    >
                      missed {missed.toString()}, slash
                    </button>
                  ) : paidNow ? (
                    <span className="pill border-save text-save">paid</span>
                  ) : (
                    <span className="pill">due</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-muted">
        {noSlash
          ? "This circle never slashes. A missed period only resets that member's streak, and every bond comes back in full."
          : "Anyone can apply a slash once a period is missed past its grace window. Half of the slashed $WIF is burned, half is shared by the members still in the circle."}
      </p>
      <TxStatus state={state} />
    </div>
  );
}

function InvitePanel({ id, bond }: { id: bigint; bond: bigint }) {
  const { address } = useAccount();
  const client = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const { state, run } = useTx();
  const [friend, setFriend] = useState("");
  const [copied, setCopied] = useState(false);

  async function sponsor() {
    const allowance = await client!.readContract({
      address: ADDR.wif,
      abi: erc20Abi,
      functionName: "allowance",
      args: [address!, ship.address],
    });
    const steps =
      allowance >= bond
        ? []
        : [
            {
              label: "Approve $WIF bond",
              send: () => writeContractAsync({ address: ADDR.wif, abi: erc20Abi, functionName: "approve", args: [ship.address, bond] }),
            },
          ];
    await run([
      ...steps,
      {
        label: "Sponsor a friend",
        send: () => writeContractAsync({ ...ship, functionName: "joinFor", args: [id, friend as Address] }),
      },
    ]);
  }

  return (
    <div className="card space-y-3">
      <h2 className="font-semibold">Bring a friend</h2>
      <button
        className="btn w-full"
        onClick={async () => {
          await navigator.clipboard.writeText(`${location.origin}/circle/${id}`);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? "Link copied" : "Copy invite link"}
      </button>
      <p className="text-xs text-muted">
        New to $WIF? A friend can pay your bond so you can start saving right away. The bond is yours when you leave.
      </p>
      <input className="input font-mono" placeholder="0x friend's wallet" value={friend} onChange={(e) => setFriend(e.target.value)} />
      <button
        className="btn w-full"
        disabled={!address || !isAddress(friend) || state.status === "pending"}
        onClick={sponsor}
      >
        Pay their {wifFmt(bond)} $WIF bond
      </button>
      <TxStatus state={state} />
    </div>
  );
}
