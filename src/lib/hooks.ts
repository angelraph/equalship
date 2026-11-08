"use client";

import { useEffect, useState } from "react";
import { useReadContract, useReadContracts } from "@/lib/wallet";
import { ADDR, isDeployed } from "./chain";
import { equalshipAbi } from "./equalshipAbi";

export const ship = { address: (ADDR.equalship || ADDR.dead) as `0x${string}`, abi: equalshipAbi } as const;

export function useStats() {
  const names = [
    "totalSaved",
    "totalBonded",
    "burnedFromFees",
    "burnedFromSlashes",
    "burnedFromVotes",
    "totalContributions",
    "circleCount",
    "feePool",
  ] as const;
  const { data } = useReadContracts({
    contracts: names.map((functionName) => ({ ...ship, functionName })),
    query: { enabled: isDeployed },
  });
  const get = (i: number) => (data?.[i]?.status === "success" ? (data[i].result as bigint) : undefined);
  return {
    totalSaved: get(0),
    totalBonded: get(1),
    burnedFromFees: get(2),
    burnedFromSlashes: get(3),
    burnedFromVotes: get(4),
    totalContributions: get(5),
    circleCount: get(6),
    feePool: get(7),
  };
}

export function useCircleCount() {
  return useReadContract({ ...ship, functionName: "circleCount", query: { enabled: isDeployed } });
}

export function useCircle(id: bigint | undefined) {
  return useReadContract({
    ...ship,
    functionName: "getCircle",
    args: id === undefined ? undefined : [id],
    query: { enabled: isDeployed && id !== undefined },
  });
}

/** Seconds since epoch, ticking once a second. */
export function useNow() {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export type CircleData = readonly [
  NonNullable<ReturnType<typeof useCircle>["data"]>[0],
  NonNullable<ReturnType<typeof useCircle>["data"]>[1],
];
