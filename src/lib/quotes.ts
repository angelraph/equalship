import type { Hex, PublicClient } from "viem";
import { quoterAbi } from "./abis";
import { ADDR } from "./chain";

export const SLIPPAGE_BPS = 150n; // 1.5%

type Leg = { weightBps: number; path: Hex };

/** Live Uniswap quote for an exact input. QuoterV2 is not a view, so it is read with a simulated call. */
export async function quote(client: PublicClient, path: Hex, amountIn: bigint): Promise<bigint> {
  const { result } = await client.simulateContract({
    address: ADDR.quoter,
    abi: quoterAbi,
    functionName: "quoteExactInput",
    args: [path, amountIn],
  });
  return result[0];
}

/** Minimum output for each basket leg of one save, with slippage applied. Mirrors the contract's split. */
export async function basketMinOuts(client: PublicClient, legs: readonly Leg[], amount: bigint, feeBps: number) {
  const rest = amount - (amount * BigInt(feeBps)) / 10_000n;
  let spent = 0n;
  const out: bigint[] = [];
  for (let i = 0; i < legs.length; i++) {
    const legIn = i === legs.length - 1 ? rest - spent : (rest * BigInt(legs[i].weightBps)) / 10_000n;
    spent += legIn;
    const q = await quote(client, legs[i].path, legIn);
    out.push((q * (10_000n - SLIPPAGE_BPS)) / 10_000n);
  }
  return out;
}

/**
 * ETH to send so a WETH route returns at least `target` (plus a 4% cushion).
 * The contract refunds whatever comes out above the target, in the output token.
 */
export async function ethFor(client: PublicClient, path: Hex, target: bigint): Promise<bigint> {
  const probe = 10n ** 15n; // 0.001 ETH
  const perProbe = await quote(client, path, probe);
  if (perProbe === 0n) throw new Error("No liquidity for this route right now");
  return (target * probe * 104n) / (perProbe * 100n) + 1n;
}
