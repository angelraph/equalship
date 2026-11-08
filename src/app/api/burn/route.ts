import { createPublicClient, createWalletClient, http, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { quoterAbi } from "@/lib/abis";
import { ADDR, BURN_PATH, robinhoodChain } from "@/lib/chain";
import { equalshipAbi } from "@/lib/equalshipAbi";

export const dynamic = "force-dynamic";

const SLIPPAGE_BPS = 300n; // 3%, the $WIF pool is thin

/**
 * Daily job: swap the USDG fee pool for $WIF and send it to the burn address.
 * Vercel Cron calls this with the CRON_SECRET bearer token.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const key = process.env.KEEPER_PRIVATE_KEY as `0x${string}` | undefined;
  if (!key || !ADDR.equalship) return Response.json({ error: "keeper not configured" }, { status: 500 });

  const transport = http(process.env.NEXT_PUBLIC_RPC_URL || undefined);
  const pub = createPublicClient({ chain: robinhoodChain, transport });
  const account = privateKeyToAccount(key);
  const wallet = createWalletClient({ chain: robinhoodChain, transport, account });
  const ship = { address: ADDR.equalship, abi: equalshipAbi } as const;

  const feePool = await pub.readContract({ ...ship, functionName: "feePool" });
  const min = parseUnits(process.env.BURN_MIN_USDG || "1", 6);
  if (feePool < min) return Response.json({ skipped: true, feePool: feePool.toString() });

  const { result } = await pub.simulateContract({
    address: ADDR.quoter,
    abi: quoterAbi,
    functionName: "quoteExactInput",
    args: [BURN_PATH, feePool],
  });
  const minOut = (result[0] * (10_000n - SLIPPAGE_BPS)) / 10_000n;

  const { request } = await pub.simulateContract({
    ...ship,
    account,
    functionName: "buyAndBurn",
    args: [BURN_PATH, feePool, minOut],
  });
  const hash = await wallet.writeContract(request);
  const receipt = await pub.waitForTransactionReceipt({ hash });

  return Response.json({
    hash,
    status: receipt.status,
    usdgIn: feePool.toString(),
    quotedWif: result[0].toString(),
  });
}
