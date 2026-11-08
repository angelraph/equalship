"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import type { Hash } from "viem";
import { usePublicClient } from "@/lib/wallet";
import { errorText } from "./format";

export type TxState = { status: "idle" | "pending" | "done" | "error"; label?: string; hash?: Hash; error?: string };

/**
 * Runs one or more wallet transactions in order, waits for each receipt,
 * then refreshes every onchain read on the page.
 */
export function useTx() {
  const client = usePublicClient();
  const queryClient = useQueryClient();
  const [state, setState] = useState<TxState>({ status: "idle" });

  const run = useCallback(
    async (steps: { label: string; send: () => Promise<Hash> }[]) => {
      try {
        let hash: Hash | undefined;
        for (const step of steps) {
          setState({ status: "pending", label: step.label });
          hash = await step.send();
          setState({ status: "pending", label: step.label, hash });
          const receipt = await client!.waitForTransactionReceipt({ hash });
          if (receipt.status !== "success") throw new Error(`${step.label} reverted`);
        }
        setState({ status: "done", hash, label: steps[steps.length - 1]?.label });
        await queryClient.invalidateQueries();
        return true;
      } catch (e) {
        setState({ status: "error", error: errorText(e) });
        return false;
      }
    },
    [client, queryClient],
  );

  return { state, run, reset: () => setState({ status: "idle" }) };
}
