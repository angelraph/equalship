"use client";

import { useState } from "react";
import { getAddress, isAddress, type Address } from "viem";
import { isDeployed } from "@/lib/chain";
import { short } from "@/lib/format";
import { ship } from "@/lib/hooks";
import { publicClient } from "@/lib/wallet";

type Row = { address: Address; committed: boolean; paid: number; streak: number; missed: number };

export function FairChecker() {
  const [text, setText] = useState("");
  const [paid, setPaid] = useState(4);
  const [streak, setStreak] = useState(4);
  const [idle, setIdle] = useState(8);
  const [rows, setRows] = useState<Row[]>();
  const [invalid, setInvalid] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function check() {
    setBusy(true);
    setError("");
    try {
      const parts = text.split(/[\s,]+/).filter(Boolean);
      const valid = [...new Set(parts.filter((p) => isAddress(p)).map((p) => getAddress(p)))].slice(0, 200);
      setInvalid(parts.length - parts.filter((p) => isAddress(p)).length);
      const res = await publicClient.multicall({
        allowFailure: true,
        contracts: valid.flatMap((a) => [
          { ...ship, functionName: "isCommitted" as const, args: [a, paid, streak, BigInt(idle * 86_400)] as const },
          { ...ship, functionName: "profileOf" as const, args: [a] as const },
        ]),
      });
      setRows(
        valid.map((a, i) => {
          const c = res[i * 2];
          const p = res[i * 2 + 1];
          const prof = p.status === "success" ? (p.result as { totalPaid: number; bestStreak: number; missed: number }) : undefined;
          return {
            address: a,
            committed: c.status === "success" ? Boolean(c.result) : false,
            paid: prof?.totalPaid ?? 0,
            streak: prof?.bestStreak ?? 0,
            missed: prof?.missed ?? 0,
          };
        }),
      );
    } catch (e) {
      setError((e as Error).message.split("\n")[0]);
    } finally {
      setBusy(false);
    }
  }

  const committed = rows?.filter((r) => r.committed).length ?? 0;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="card space-y-4">
        <textarea
          className="input h-48 font-mono text-xs"
          placeholder={"0x...\n0x...\n0x..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="grid grid-cols-3 gap-3 text-sm">
          <Num label="Periods paid" value={paid} set={setPaid} />
          <Num label="Best streak" value={streak} set={setStreak} />
          <Num label="Active in days" value={idle} set={setIdle} />
        </div>
        <button className="btn btn-primary w-full" disabled={!isDeployed || busy || !text.trim()} onClick={check}>
          {busy ? "Checking" : "Check wallets"}
        </button>
        {error && <p className="text-sm text-down">{error}</p>}
      </div>
      <div className="card">
        {!rows && <p className="text-sm text-muted">Results show here: who would count and who would not.</p>}
        {rows && (
          <>
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
              <p className="display text-3xl">
                {committed} <span className="text-base font-normal text-muted">of {rows.length} committed</span>
              </p>
              {invalid > 0 && <p className="text-xs text-muted">{invalid} entries were not addresses</p>}
            </div>
            <div className="mt-4 max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted">
                    <th className="pb-2 font-medium">Wallet</th>
                    <th className="pb-2 font-medium">Paid</th>
                    <th className="pb-2 font-medium">Streak</th>
                    <th className="pb-2 font-medium">Counts</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.address} className="border-t border-line">
                      <td className="py-2 font-mono text-xs">{short(r.address)}</td>
                      <td className="py-2 font-mono">{r.paid}</td>
                      <td className="py-2 font-mono">{r.streak}</td>
                      <td className="py-2">
                        <span className={`pill ${r.committed ? "border-up text-up" : "text-muted"}`}>{r.committed ? "yes" : "no"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Num({ label, value, set }: { label: string; value: number; set: (n: number) => void }) {
  return (
    <label className="block space-y-1">
      <span className="label">{label}</span>
      <input className="input" type="number" min={0} value={value} onChange={(e) => set(Math.max(0, Number(e.target.value)))} />
    </label>
  );
}
