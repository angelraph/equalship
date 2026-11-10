import { createPublicClient, http, isAddress, type Address } from "viem";
import { ADDR, robinhoodChain } from "@/lib/chain";
import { equalshipAbi } from "@/lib/equalshipAbi";

const pub = createPublicClient({ chain: robinhoodChain, transport: http(process.env.NEXT_PUBLIC_RPC_URL || undefined) });

/**
 * Public Proof of Commitment record for one wallet.
 * GET /api/commitment/0x...?paid=4&streak=4&idleDays=8
 */
export async function GET(req: Request, { params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  if (!isAddress(address)) return Response.json({ error: "not an address" }, { status: 400 });
  if (!ADDR.equalship) return Response.json({ error: "contract not configured" }, { status: 500 });

  const q = new URL(req.url).searchParams;
  const minPaid = clamp(Number(q.get("paid") ?? 4), 0, 1000);
  const minStreak = clamp(Number(q.get("streak") ?? 4), 0, 1000);
  const idleDays = clamp(Number(q.get("idleDays") ?? 8), 1, 3650);

  const ship = { address: ADDR.equalship as Address, abi: equalshipAbi } as const;
  const [profile, committed] = await Promise.all([
    pub.readContract({ ...ship, functionName: "profileOf", args: [address] }),
    pub.readContract({
      ...ship,
      functionName: "isCommitted",
      args: [address, minPaid, minStreak, BigInt(idleDays * 86_400)],
    }),
  ]);

  return Response.json(
    {
      address,
      committed,
      rule: { minPaid, minStreak, maxIdleDays: idleDays },
      record: {
        periodsPaid: profile.totalPaid,
        bestStreak: profile.bestStreak,
        missed: profile.missed,
        circlesJoined: profile.circlesJoined,
        totalSavedUsdg: Number(profile.totalSaved) / 1e6,
        firstPaidAt: profile.firstPaidAt ? new Date(Number(profile.firstPaidAt) * 1000).toISOString() : null,
        lastPaidAt: profile.lastPaidAt ? new Date(Number(profile.lastPaidAt) * 1000).toISOString() : null,
      },
      contract: ADDR.equalship,
      chainId: robinhoodChain.id,
    },
    { headers: { "cache-control": "public, s-maxage=30", "access-control-allow-origin": "*" } },
  );
}

function clamp(n: number, lo: number, hi: number) {
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.floor(n))) : lo;
}
