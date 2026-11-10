"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { decodeEventLog, parseUnits } from "viem";
import { useAccount, usePublicClient, useReadContract, useWriteContract } from "@/lib/wallet";
import { erc20Abi } from "@/lib/abis";
import { ADDR, PERIODS, isDeployed } from "@/lib/chain";
import { equalshipAbi } from "@/lib/equalshipAbi";
import { errorText, wifFmt } from "@/lib/format";
import { ship } from "@/lib/hooks";
import { BasketPicker, basketFrom, type Weights } from "./BasketPicker";
import { RegionGate, useRegionOk } from "./RegionGate";

export function CreateCircle() {
  const router = useRouter();
  const { address } = useAccount();
  const client = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const regionOk = useRegionOk();

  const [name, setName] = useState("");
  const [contribution, setContribution] = useState("10");
  const [bond, setBond] = useState("5000");
  const [period, setPeriod] = useState<number>(PERIODS[2].seconds);
  const [maxMembers, setMaxMembers] = useState(10);
  const [slash, setSlash] = useState(0);
  const [weights, setWeights] = useState<Weights>({ NVDA: 50, SPY: 50 });
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: wifBal } = useReadContract({
    address: ADDR.wif,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const basket = basketFrom(weights);

  async function submit() {
    if (!address || !client) return;
    setBusy(true);
    try {
      const bondWei = parseUnits(bond || "0", 18);
      const allowance = await client.readContract({
        address: ADDR.wif,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, ship.address],
      });
      if (allowance < bondWei) {
        setStatus("Approve $WIF for the bond");
        const h = await writeContractAsync({
          address: ADDR.wif,
          abi: erc20Abi,
          functionName: "approve",
          args: [ship.address, bondWei],
        });
        await client.waitForTransactionReceipt({ hash: h });
      }

      setStatus("Create the circle");
      const hash = await writeContractAsync({
        ...ship,
        functionName: "createCircle",
        args: [name.trim(), parseUnits(contribution || "0", 6), bondWei, period, maxMembers, slash * 100, basket.legs],
      });
      const receipt = await client.waitForTransactionReceipt({ hash });
      for (const log of receipt.logs) {
        try {
          const ev = decodeEventLog({ abi: equalshipAbi, data: log.data, topics: log.topics });
          if (ev.eventName === "CircleCreated") {
            router.push(`/circle/${ev.args.circleId}`);
            return;
          }
        } catch {
          // log from another contract
        }
      }
      setStatus("Created");
    } catch (e) {
      setStatus(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  const valid =
    name.trim().length > 0 &&
    Number(contribution) >= 1 &&
    Number(bond) > 0 &&
    maxMembers >= 2 &&
    maxMembers <= 50 &&
    slash >= 0 &&
    slash <= 50 &&
    basket.valid &&
    basket.picked.length <= 5;

  return (
    <div className="card sticky top-20 space-y-4">
      <h2 className="text-lg font-semibold">Start a circle</h2>
      <Field label="Name">
        <input
          className="input"
          maxLength={48}
          placeholder="Lagos builders"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="USDG each period">
          <input
            className="input"
            type="number"
            min={1}
            value={contribution}
            onChange={(e) => setContribution(e.target.value)}
          />
        </Field>
        <Field label="$WIF bond">
          <input className="input" type="number" min={1} value={bond} onChange={(e) => setBond(e.target.value)} />
        </Field>
      </div>
      <Field label="How often">
        <select className="input" value={period} onChange={(e) => setPeriod(Number(e.target.value))}>
          {PERIODS.map((p) => (
            <option key={p.seconds} value={p.seconds}>
              {p.label}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Max members">
          <input
            className="input"
            type="number"
            min={2}
            max={50}
            value={maxMembers}
            onChange={(e) => setMaxMembers(Number(e.target.value))}
          />
        </Field>
        <Field label="Slash per miss (%), 0 = never">
          <input
            className="input"
            type="number"
            min={0}
            max={50}
            value={slash}
            onChange={(e) => setSlash(Number(e.target.value))}
          />
        </Field>
      </div>

      <BasketPicker weights={weights} onChange={setWeights} />
      {basket.needsStock && <RegionGate />}

      <button
        className="btn btn-primary w-full"
        disabled={!isDeployed || !address || !valid || busy || (basket.needsStock && !regionOk)}
        onClick={submit}
      >
        {busy ? status : address ? "Create and bond" : "Connect a wallet first"}
      </button>
      {!busy && status && <p className="text-sm text-muted">{status}</p>}
      {address && <p className="text-xs text-muted">Your $WIF balance: {wifFmt(wifBal)}</p>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}
