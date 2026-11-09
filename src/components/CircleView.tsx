"use client";

import { useState } from "react";
import { isAddress, type Address } from "viem";
import { useAccount, usePublicClient, useReadContract, useReadContracts, useWriteContract } from "@/lib/wallet";
import { erc20Abi, quoterAbi } from "@/lib/abis";
import { ADDR, EXPLORER, assetByAddress, isDeployed, periodLabel } from "@/lib/chain";
import { countdown, fmt, short, usd, wifFmt } from "@/lib/format";
import { ship, useCircle, useNow } from "@/lib/hooks";
import { useTx } from "@/lib/useTx";
import { BasketVote } from "./BasketVote";
import { WalletButton } from "./Header";
import { RegionGate, useRegionOk } from "./RegionGate";
import { TxStatus } from "./TxStatus";

const SLIPPAGE_BPS = 150n; // 1.5%

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
            {usd(c.contribution)} every {periodLabel(c.period)}. Bond {wifFmt(c.bond)} $WIF. Missing {periodLabel(c.period) === "hour" ? "an" : "a"}{" "}
            {periodLabel(c.period)} costs {c.slashBps / 100}% of the bond.
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-6">
          <MembersTable id={id} rows={members} currentPeriod={p} />
          <BasketVote id={id} circle={c} isMember={!!me?.m?.active} />
        </section>
        <aside className="space-y-4">
          <YourPanel id={id} circle={c} legs={legs} me={me} period={p} />
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

type Circle = NonNullable<ReturnType<typeof useCircle>["data"]>[0];
type Legs = NonNullable<ReturnType<typeof useCircle>["data"]>[1];
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

function MembersTable({ id, rows, currentPeriod }: { id: bigint; rows: MemberRow[]; currentPeriod: bigint }) {
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
        Anyone can apply a slash once a period closes unpaid. Half of the slashed $WIF is burned, half is shared by the
        members still in the circle.
      </p>
      <TxStatus state={state} />
    </div>
  );
}

function YourPanel({
  id,
  circle,
  legs,
  me,
  period,
}: {
  id: bigint;
  circle: Circle;
  legs: Legs;
  me?: MemberRow;
  period: bigint;
}) {
  const { address } = useAccount();
  const client = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const { state, run } = useTx();
  const regionOk = useRegionOk();
  const needsStock = legs.some((l) => assetByAddress(l.token)?.stock !== false);

  const { data: bal } = useReadContracts({
    contracts: [
      { address: ADDR.usdg, abi: erc20Abi, functionName: "balanceOf", args: [address ?? ADDR.dead] },
      { address: ADDR.wif, abi: erc20Abi, functionName: "balanceOf", args: [address ?? ADDR.dead] },
    ],
    query: { enabled: !!address },
  });
  const usdgBal = bal?.[0]?.status === "success" ? (bal[0].result as bigint) : undefined;
  const wifBal = bal?.[1]?.status === "success" ? (bal[1].result as bigint) : undefined;

  const { data: reward } = useReadContract({
    ...ship,
    functionName: "pendingReward",
    args: [id, address ?? ADDR.dead],
    query: { enabled: !!address },
  });

  const active = !!me?.m?.active;
  const paidNow = active && me!.m!.nextDue > period;
  const full = circle.memberCount >= circle.maxMembers;

  async function ensureAllowance(token: Address, amount: bigint, label: string) {
    const allowance = await client!.readContract({
      address: token,
      abi: erc20Abi,
      functionName: "allowance",
      args: [address!, ship.address],
    });
    return allowance >= amount
      ? []
      : [
          {
            label,
            send: () => writeContractAsync({ address: token, abi: erc20Abi, functionName: "approve", args: [ship.address, amount] }),
          },
        ];
  }

  async function join() {
    const steps = await ensureAllowance(ADDR.wif, circle.bond, "Approve $WIF bond");
    await run([...steps, { label: "Join circle", send: () => writeContractAsync({ ...ship, functionName: "join", args: [id] }) }]);
  }

  async function contribute() {
    const amount = circle.contribution;
    const feeBps = await client!.readContract({ ...ship, functionName: "feeBps" });
    const rest = amount - (amount * BigInt(feeBps)) / 10_000n;

    let spent = 0n;
    const minOuts: bigint[] = [];
    for (let i = 0; i < legs.length; i++) {
      const legIn = i === legs.length - 1 ? rest - spent : (rest * BigInt(legs[i].weightBps)) / 10_000n;
      spent += legIn;
      const { result } = await client!.simulateContract({
        address: ADDR.quoter,
        abi: quoterAbi,
        functionName: "quoteExactInput",
        args: [legs[i].path, legIn],
      });
      minOuts.push((result[0] * (10_000n - SLIPPAGE_BPS)) / 10_000n);
    }
    const steps = await ensureAllowance(ADDR.usdg, amount, "Approve USDG");
    await run([
      ...steps,
      {
        label: "Save and buy basket",
        send: () => writeContractAsync({ ...ship, functionName: "contribute", args: [id, minOuts] }),
      },
    ]);
  }

  return (
    <div className="card space-y-4">
      <h2 className="font-semibold">You</h2>
      {!address && (
        <>
          <p className="text-sm text-muted">Connect a wallet to join or save.</p>
          <WalletButton />
        </>
      )}
      {address && (
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="label">USDG</p>
            <p className="font-mono">{fmt(usdgBal, 6)}</p>
          </div>
          <div>
            <p className="label">$WIF</p>
            <p className="font-mono">{wifFmt(wifBal)}</p>
          </div>
        </div>
      )}

      {address && !active && (
        <>
          <p className="text-sm text-muted">
            Bond {wifFmt(circle.bond)} $WIF to join. You get it back when you leave, minus any slashes for missed{" "}
            {periodLabel(circle.period)}s.
          </p>
          <button className="btn btn-primary w-full" disabled={full || state.status === "pending"} onClick={join}>
            {full ? "Circle is full" : "Bond and join"}
          </button>
        </>
      )}

      {active && me?.m && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-save-soft p-2">
              <p className="font-mono text-xl font-semibold text-save">{me.m.streak}</p>
              <p className="text-xs text-muted">streak</p>
            </div>
            <div className="rounded-lg bg-paper p-2">
              <p className="font-mono text-xl font-semibold">{me.m.paidCount}</p>
              <p className="text-xs text-muted">paid</p>
            </div>
            <div className="rounded-lg bg-paper p-2">
              <p className="font-mono text-xl font-semibold">{wifFmt(me.m.bondLeft)}</p>
              <p className="text-xs text-muted">bond left</p>
            </div>
          </div>
          {needsStock && !paidNow && <RegionGate />}
          <button
            className="btn btn-save w-full py-3"
            disabled={paidNow || state.status === "pending" || (needsStock && !regionOk)}
            onClick={contribute}
          >
            {paidNow ? `Paid for this ${periodLabel(circle.period)}` : `Save ${usd(circle.contribution)} now`}
          </button>
          <div className="flex gap-2">
            <button
              className="btn flex-1"
              disabled={!reward || state.status === "pending"}
              onClick={() => run([{ label: "Claim rewards", send: () => writeContractAsync({ ...ship, functionName: "claim", args: [id] }) }])}
            >
              Claim {wifFmt(reward)} $WIF
            </button>
            <button
              className="btn"
              disabled={state.status === "pending"}
              onClick={() => run([{ label: "Leave circle", send: () => writeContractAsync({ ...ship, functionName: "leave", args: [id] }) }])}
            >
              Leave
            </button>
          </div>
        </>
      )}
      <TxStatus state={state} />
      {state.status === "done" && state.label === "Save and buy basket" && (
        <p className="text-sm text-save">Your Stock Tokens are in your wallet. See you next {periodLabel(circle.period)}.</p>
      )}
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
