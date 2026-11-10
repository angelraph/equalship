import { createPublicClient, createWalletClient, http, parseUnits, type Address, type Hash, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ADDR, BURN_PATH, robinhoodChain } from "@/lib/chain";
import { equalshipAbi } from "@/lib/equalshipAbi";
import { basketMinOuts, quote } from "@/lib/quotes";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BURN_SLIPPAGE_BPS = 300n; // 3%, the $WIF pool is thin
const MAX_SAVES_PER_RUN = 25;

/**
 * Daily job, called by Vercel Cron with the CRON_SECRET bearer token:
 * 1. saves for every member who turned auto-save on and can save now
 * 2. swaps the USDG fee pool for $WIF and burns it
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const key = process.env.KEEPER_PRIVATE_KEY as Hex | undefined;
  if (!key || !ADDR.equalship) return Response.json({ error: "keeper not configured" }, { status: 500 });

  const transport = http(process.env.NEXT_PUBLIC_RPC_URL || undefined);
  const pub = createPublicClient({ chain: robinhoodChain, transport });
  const account = privateKeyToAccount(key);
  const wallet = createWalletClient({ chain: robinhoodChain, transport, account });
  const ship = { address: ADDR.equalship as Address, abi: equalshipAbi } as const;

  const saves: { circle: string; member: string; hash?: Hash; error?: string }[] = [];
  const feeBps = Number(await pub.readContract({ ...ship, functionName: "feeBps" }));
  const count = await pub.readContract({ ...ship, functionName: "circleCount" });

  for (let id = 0n; id < count && saves.length < MAX_SAVES_PER_RUN; id++) {
    const [circle, legs] = await pub.readContract({ ...ship, functionName: "getCircle", args: [id] });
    const members = await pub.readContract({ ...ship, functionName: "members", args: [id] });
    for (const member of members) {
      if (saves.length >= MAX_SAVES_PER_RUN) break;
      const [on, can] = await Promise.all([
        pub.readContract({ ...ship, functionName: "autoSave", args: [id, member] }),
        pub.readContract({ ...ship, functionName: "canSave", args: [id, member] }),
      ]);
      if (!on || !can) continue;
      try {
        const minOuts = await basketMinOuts(pub, legs, circle.contribution, feeBps);
        const { request } = await pub.simulateContract({
          ...ship,
          account,
          functionName: "contributeFor",
          args: [id, member, minOuts],
        });
        const hash = await wallet.writeContract(request);
        await pub.waitForTransactionReceipt({ hash });
        saves.push({ circle: id.toString(), member, hash });
      } catch (e) {
        // usually the member removed their USDG approval or ran out of USDG: skip, never retry blindly
        saves.push({ circle: id.toString(), member, error: (e as Error).message.split("\n")[0].slice(0, 160) });
      }
    }
  }

  let burn: { hash?: Hash; usdgIn?: string; skipped?: boolean; error?: string } = { skipped: true };
  const feePool = await pub.readContract({ ...ship, functionName: "feePool" });
  const min = parseUnits(process.env.BURN_MIN_USDG || "1", 6);
  if (feePool >= min) {
    try {
      const q = await quote(pub, BURN_PATH, feePool);
      const minOut = (q * (10_000n - BURN_SLIPPAGE_BPS)) / 10_000n;
      const { request } = await pub.simulateContract({
        ...ship,
        account,
        functionName: "buyAndBurn",
        args: [BURN_PATH, feePool, minOut],
      });
      const hash = await wallet.writeContract(request);
      await pub.waitForTransactionReceipt({ hash });
      burn = { hash, usdgIn: feePool.toString() };
    } catch (e) {
      burn = { error: (e as Error).message.split("\n")[0].slice(0, 160) };
    }
  }

  return Response.json({ saves, burn });
}
