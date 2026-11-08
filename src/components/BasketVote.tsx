"use client";

import { useState } from "react";
import { parseUnits } from "viem";
import { useAccount, usePublicClient, useReadContract, useWriteContract } from "@/lib/wallet";
import { erc20Abi } from "@/lib/abis";
import { ADDR, assetByAddress } from "@/lib/chain";
import { countdown, short, wifFmt } from "@/lib/format";
import { ship, useNow, type useCircle } from "@/lib/hooks";
import { useTx } from "@/lib/useTx";
import { BasketPicker, basketFrom, type Weights } from "./BasketPicker";
import { TxStatus } from "./TxStatus";

type Circle = NonNullable<ReturnType<typeof useCircle>["data"]>[0];

export function BasketVote({ id, circle, isMember }: { id: bigint; circle: Circle; isMember: boolean }) {
  const { address } = useAccount();
  const client = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const { state, run } = useTx();
  const now = useNow();
  const [weights, setWeights] = useState<Weights>({});
  const [amount, setAmount] = useState("1");
  const [proposing, setProposing] = useState(false);

  const latestId = circle.proposalCount > 0n ? circle.proposalCount - 1n : undefined;
  const { data: proposal } = useReadContract({
    ...ship,
    functionName: "getProposal",
    args: latestId === undefined ? undefined : [id, latestId],
    query: { enabled: latestId !== undefined },
  });
  const { data: voted } = useReadContract({
    ...ship,
    functionName: "hasVoted",
    args: latestId === undefined || !address ? undefined : [id, latestId, address],
    query: { enabled: latestId !== undefined && !!address },
  });

  const pr = proposal?.[0];
  const prLegs = proposal?.[1] ?? [];
  const open = pr && !pr.executed && now <= Number(pr.deadline);
  const canExecute =
    pr && !pr.executed && now > Number(pr.deadline) && pr.yesWif > pr.noWif && pr.yesVoters * 2 >= circle.memberCount;
  const basket = basketFrom(weights);

  async function castVote(support: boolean) {
    const wei = parseUnits(amount || "0", 18);
    const allowance = await client!.readContract({
      address: ADDR.wif,
      abi: erc20Abi,
      functionName: "allowance",
      args: [address!, ship.address],
    });
    await run([
      ...(allowance >= wei
        ? []
        : [
            {
              label: "Approve $WIF to burn",
              send: () =>
                writeContractAsync({ address: ADDR.wif, abi: erc20Abi, functionName: "approve", args: [ship.address, wei] }),
            },
          ]),
      {
        label: support ? "Burn $WIF for yes" : "Burn $WIF for no",
        send: () => writeContractAsync({ ...ship, functionName: "vote", args: [id, latestId!, support, wei] }),
      },
    ]);
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-semibold">Basket vote</h2>
        <span className="text-xs text-muted">1 $WIF burned is 1 vote</span>
      </div>

      {!pr && <p className="text-sm text-muted">No basket change proposed yet.</p>}

      {pr && (
        <div className="rounded-xl border border-line p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm">
              Proposal #{latestId!.toString()} by <span className="font-mono">{short(pr.proposer)}</span>
            </p>
            <span className="pill">
              {pr.executed ? "applied" : open ? `closes in ${countdown(Number(pr.deadline) - now)}` : "closed"}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {prLegs.map((l) => (
              <span key={l.token} className="pill">
                <b>{assetByAddress(l.token)?.symbol ?? short(l.token)}</b> {l.weightBps / 100}%
              </span>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-save-soft p-3">
              <p className="label">Yes</p>
              <p className="font-mono text-lg">{wifFmt(pr.yesWif)}</p>
              <p className="text-xs text-muted">{pr.yesVoters} voters</p>
            </div>
            <div className="rounded-lg bg-burn-soft p-3">
              <p className="label">No</p>
              <p className="font-mono text-lg">{wifFmt(pr.noWif)}</p>
            </div>
          </div>
          {open && isMember && !voted && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <input className="input w-28" type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} />
              <span className="text-sm text-muted">$WIF</span>
              <button className="btn btn-save" disabled={state.status === "pending" || Number(amount) < 1} onClick={() => castVote(true)}>
                Burn for yes
              </button>
              <button className="btn btn-burn" disabled={state.status === "pending" || Number(amount) < 1} onClick={() => castVote(false)}>
                Burn for no
              </button>
            </div>
          )}
          {open && voted && <p className="mt-3 text-sm text-muted">You voted on this proposal.</p>}
          {canExecute && (
            <button
              className="btn btn-primary mt-4"
              onClick={() =>
                run([{ label: "Apply basket", send: () => writeContractAsync({ ...ship, functionName: "executeBasket", args: [id, latestId!] }) }])
              }
            >
              Apply the new basket
            </button>
          )}
          <p className="mt-3 text-xs text-muted">
            Passes when more $WIF is burned for it than against it and at least half of the members vote yes.
          </p>
        </div>
      )}

      {isMember && !open && (
        <div>
          {!proposing ? (
            <button className="btn" onClick={() => setProposing(true)}>
              Propose a new basket
            </button>
          ) : (
            <div className="space-y-3">
              <BasketPicker weights={weights} onChange={setWeights} />
              <button
                className="btn btn-primary"
                disabled={!basket.valid || basket.picked.length > 5 || state.status === "pending"}
                onClick={async () => {
                  const ok = await run([
                    {
                      label: "Propose basket",
                      send: () => writeContractAsync({ ...ship, functionName: "proposeBasket", args: [id, basket.legs] }),
                    },
                  ]);
                  if (ok) setProposing(false);
                }}
              >
                Open the vote
              </button>
            </div>
          )}
        </div>
      )}
      <TxStatus state={state} />
    </div>
  );
}
