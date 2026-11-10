"use client";

import { useState } from "react";
import { formatEther, type Address, type Hex } from "viem";
import { erc20Abi } from "@/lib/abis";
import { ADDR, assetByAddress, periodLabel } from "@/lib/chain";
import { fmt, usd, wifFmt } from "@/lib/format";
import { ship, type CircleData } from "@/lib/hooks";
import { circleReminderIcs, downloadIcs } from "@/lib/ics";
import { basketMinOuts, ethFor } from "@/lib/quotes";
import { useTx } from "@/lib/useTx";
import { useAccount, usePublicClient, useReadContract, useReadContracts, useWriteContract } from "@/lib/wallet";
import { WalletButton } from "./Header";
import { RegionGate, useRegionOk } from "./RegionGate";
import { TxStatus } from "./TxStatus";

type Circle = CircleData[0];
type Legs = CircleData[1];
type MemberData = {
  active: boolean;
  nextDue: bigint;
  streak: number;
  paidCount: number;
  bondLeft: bigint;
};

const AUTO_SAVE_PERIODS = 12n;

export function YourPanel({ id, circle, legs, me }: { id: bigint; circle: Circle; legs: Legs; me?: MemberData }) {
  const { address } = useAccount();
  const client = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const { state, run } = useTx();
  const regionOk = useRegionOk();
  const [payWith, setPayWith] = useState<"eth" | "token">("eth");
  const needsStock = legs.some((l) => assetByAddress(l.token)?.stock !== false);
  const noSlash = circle.slashBps === 0;
  const owner = address ?? ADDR.dead;

  const { data: bal } = useReadContracts({
    contracts: [
      { address: ADDR.usdg, abi: erc20Abi, functionName: "balanceOf", args: [owner] },
      { address: ADDR.wif, abi: erc20Abi, functionName: "balanceOf", args: [owner] },
      { address: ADDR.usdg, abi: erc20Abi, functionName: "allowance", args: [owner, ship.address] },
    ],
    query: { enabled: !!address },
  });
  const usdgBal = bal?.[0]?.status === "success" ? (bal[0].result as bigint) : undefined;
  const wifBal = bal?.[1]?.status === "success" ? (bal[1].result as bigint) : undefined;
  const usdgAllowance = bal?.[2]?.status === "success" ? (bal[2].result as bigint) : 0n;

  const { data: reward } = useReadContract({ ...ship, functionName: "pendingReward", args: [id, owner], query: { enabled: !!address } });
  const { data: canSave } = useReadContract({ ...ship, functionName: "canSave", args: [id, owner], query: { enabled: !!address } });
  const { data: auto } = useReadContract({ ...ship, functionName: "autoSave", args: [id, owner], query: { enabled: !!address } });

  const active = !!me?.active;
  const full = circle.memberCount >= circle.maxMembers;
  const busy = state.status === "pending";

  async function allowanceStep(token: Address, amount: bigint, label: string) {
    const allowance = await client.readContract({ address: token, abi: erc20Abi, functionName: "allowance", args: [address!, ship.address] });
    return allowance >= amount
      ? []
      : [{ label, send: () => writeContractAsync({ address: token, abi: erc20Abi, functionName: "approve", args: [ship.address, amount] }) }];
  }

  async function join() {
    if (payWith === "eth") {
      const path = (await client.readContract({ ...ship, functionName: "ethToWif" })) as Hex;
      const value = await ethFor(client, path, circle.bond);
      await run([
        {
          label: `Join with ${Number(formatEther(value)).toFixed(6)} ETH`,
          send: () => writeContractAsync({ ...ship, functionName: "joinWithETH", args: [id, circle.bond], value }),
        },
      ]);
      return;
    }
    const steps = await allowanceStep(ADDR.wif, circle.bond, "Approve $WIF bond");
    await run([...steps, { label: "Join circle", send: () => writeContractAsync({ ...ship, functionName: "join", args: [id] }) }]);
  }

  async function save() {
    const feeBps = await client.readContract({ ...ship, functionName: "feeBps" });
    const minOuts = await basketMinOuts(client, legs, circle.contribution, Number(feeBps));
    if (payWith === "eth") {
      const path = (await client.readContract({ ...ship, functionName: "ethToUsdg" })) as Hex;
      const value = await ethFor(client, path, circle.contribution);
      await run([
        {
          label: "Save and buy basket",
          send: () => writeContractAsync({ ...ship, functionName: "contributeWithETH", args: [id, circle.contribution, minOuts], value }),
        },
      ]);
      return;
    }
    const steps = await allowanceStep(ADDR.usdg, circle.contribution, "Approve USDG");
    await run([...steps, { label: "Save and buy basket", send: () => writeContractAsync({ ...ship, functionName: "contribute", args: [id, minOuts] }) }]);
  }

  async function toggleAuto(on: boolean) {
    const need = circle.contribution * AUTO_SAVE_PERIODS;
    const steps = on && usdgAllowance < need ? await allowanceStep(ADDR.usdg, need, `Allow ${AUTO_SAVE_PERIODS} saves of USDG`) : [];
    await run([...steps, { label: on ? "Turn on auto-save" : "Turn off auto-save", send: () => writeContractAsync({ ...ship, functionName: "setAutoSave", args: [id, on] }) }]);
  }

  async function revokeUsdg() {
    await run([{ label: "Remove USDG approval", send: () => writeContractAsync({ address: ADDR.usdg, abi: erc20Abi, functionName: "approve", args: [ship.address, 0n] }) }]);
  }

  function reminders() {
    downloadIcs(
      `equalship-circle-${id}.ics`,
      circleReminderIcs({ circleId: id, name: circle.name, start: Number(circle.start), period: circle.period, url: `${location.origin}/circle/${id}` }),
    );
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">You</h2>
        {noSlash ? (
          <span className="pill border-up text-up">Bond always refundable</span>
        ) : (
          <span className="pill border-warn text-warn">Slash {circle.slashBps / 100}% per miss</span>
        )}
      </div>

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

      {address && (!active || canSave) && (
        <div className="grid grid-cols-2 gap-1 rounded-full border border-line bg-paper p-1 text-xs">
          <button className={`rounded-full py-1.5 ${payWith === "eth" ? "bg-ink text-paper" : "text-muted"}`} onClick={() => setPayWith("eth")}>
            Pay with ETH
          </button>
          <button className={`rounded-full py-1.5 ${payWith === "token" ? "bg-ink text-paper" : "text-muted"}`} onClick={() => setPayWith("token")}>
            {active ? "Pay with USDG" : "Pay with $WIF"}
          </button>
        </div>
      )}

      {address && !active && (
        <>
          <p className="text-sm text-muted">
            The bond is {wifFmt(circle.bond)} $WIF.{" "}
            {payWith === "eth"
              ? "Your ETH buys it on Uniswap and any extra $WIF comes back to your wallet."
              : "It comes from your $WIF balance."}{" "}
            {noSlash
              ? "Leave any time and the full bond comes back."
              : `Leave any time and it comes back, minus ${circle.slashBps / 100}% for each ${periodLabel(circle.period)} you miss past the grace window.`}
          </p>
          <button className="btn btn-primary w-full" disabled={full || busy} onClick={join}>
            {full ? "Circle is full" : payWith === "eth" ? "Join with ETH" : "Bond and join"}
          </button>
        </>
      )}

      {active && me && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-save-soft p-2">
              <p className="font-mono text-xl font-semibold text-brand-2">{me.streak}</p>
              <p className="text-xs text-muted">streak</p>
            </div>
            <div className="rounded-2xl bg-card-2 p-2">
              <p className="font-mono text-xl font-semibold">{me.paidCount}</p>
              <p className="text-xs text-muted">paid</p>
            </div>
            <div className="rounded-2xl bg-card-2 p-2">
              <p className="font-mono text-xl font-semibold">{wifFmt(me.bondLeft)}</p>
              <p className="text-xs text-muted">bond</p>
            </div>
          </div>
          {needsStock && canSave && <RegionGate />}
          <button className="btn btn-save w-full py-3" disabled={!canSave || busy || (needsStock && !regionOk)} onClick={save}>
            {canSave ? `Save ${usd(circle.contribution)} ${payWith === "eth" ? "with ETH" : "with USDG"}` : `Saved for this ${periodLabel(circle.period)}`}
          </button>

          <div className="rounded-2xl border border-line p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Auto-save</p>
                <p className="text-xs text-muted">
                  {auto
                    ? "On. The keeper saves for you each period from your approved USDG, into your wallet."
                    : `Never miss a ${periodLabel(circle.period)}. Uses a USDG approval you can remove any time.`}
                </p>
              </div>
              <button className={`btn shrink-0 ${auto ? "" : "btn-primary"}`} disabled={busy} onClick={() => toggleAuto(!auto)}>
                {auto ? "Turn off" : "Turn on"}
              </button>
            </div>
            {usdgAllowance > 0n && (
              <button className="mt-3 text-xs text-muted underline underline-offset-4" disabled={busy} onClick={revokeUsdg}>
                Remove USDG approval ({fmt(usdgAllowance, 6)} approved)
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              className="btn flex-1"
              disabled={!reward || busy}
              onClick={() => run([{ label: "Claim rewards", send: () => writeContractAsync({ ...ship, functionName: "claim", args: [id] }) }])}
            >
              Claim {wifFmt(reward)} $WIF
            </button>
            <button
              className="btn"
              disabled={busy}
              onClick={() => run([{ label: "Leave circle", send: () => writeContractAsync({ ...ship, functionName: "leave", args: [id] }) }])}
            >
              Leave
            </button>
          </div>
        </>
      )}

      {address && (
        <button className="btn btn-ghost w-full text-sm" onClick={reminders}>
          Add reminders to my calendar
        </button>
      )}

      <TxStatus state={state} />
      {state.status === "done" && state.label === "Save and buy basket" && (
        <p className="text-sm text-up">Your Stock Tokens are in your wallet. See you next {periodLabel(circle.period)}.</p>
      )}
    </div>
  );
}
