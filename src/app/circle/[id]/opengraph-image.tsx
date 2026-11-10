import { ImageResponse } from "next/og";
import { createPublicClient, http, type Address } from "viem";
import { ADDR, assetByAddress, periodLabel, robinhoodChain } from "@/lib/chain";
import { equalshipAbi } from "@/lib/equalshipAbi";

export const alt = "An Equalship savings circle";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 300;

const pub = createPublicClient({ chain: robinhoodChain, transport: http(process.env.NEXT_PUBLIC_RPC_URL || undefined) });

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let name = "Equalship circle";
  let line = "Save together. Own together.";
  let saved = "";
  let members = "";
  let basket: string[] = [];
  let safe = false;
  try {
    if (ADDR.equalship && /^\d+$/.test(id)) {
      const [c, legs] = await pub.readContract({
        address: ADDR.equalship as Address,
        abi: equalshipAbi,
        functionName: "getCircle",
        args: [BigInt(id)],
      });
      name = c.name;
      line = `$${(Number(c.contribution) / 1e6).toLocaleString("en-US")} every ${periodLabel(c.period)}`;
      saved = `$${(Number(c.totalSaved) / 1e6).toLocaleString("en-US", { maximumFractionDigits: 2 })} saved`;
      members = `${c.memberCount} of ${c.maxMembers} members`;
      basket = legs.map((l) => `${assetByAddress(l.token)?.symbol ?? "?"} ${l.weightBps / 100}%`);
      safe = c.slashBps === 0;
    }
  } catch {
    // unknown circle or RPC hiccup: fall back to the brand card
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "radial-gradient(circle at 20% 0%, #3b1f7a 0%, #0b0a10 60%)",
          color: "#f4f2fa",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 34, fontWeight: 700 }}>
          <div style={{ display: "flex", width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg,#a78bfa,#6d28d9)" }} />
          <span>
            Equal<span style={{ color: "#a78bfa" }}>ship</span>
          </span>
          <span style={{ marginLeft: "auto", fontSize: 24, color: "#a39fb4" }}>Circle #{id}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 76, fontWeight: 800, letterSpacing: -2, lineHeight: 1.05 }}>{name}</div>
          <div style={{ fontSize: 36, color: "#c4b5fd" }}>{line}</div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 8 }}>
            {basket.map((b) => (
              <div key={b} style={{ display: "flex", padding: "10px 22px", borderRadius: 999, border: "2px solid #3a3550", fontSize: 26 }}>
                {b}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 26, color: "#a39fb4" }}>
          <div style={{ display: "flex", gap: 36 }}>
            {saved && <span>{saved}</span>}
            {members && <span>{members}</span>}
            {safe && <span style={{ color: "#3dd68c" }}>Bond always refundable</span>}
          </div>
          <span>Join with ETH on Robinhood Chain</span>
        </div>
      </div>
    ),
    size,
  );
}
