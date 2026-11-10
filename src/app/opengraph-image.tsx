import { ImageResponse } from "next/og";

export const alt = "Equalship: save together, own together";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 88,
          background: "radial-gradient(circle at 75% 20%, #4c1d95 0%, #0b0a10 62%)",
          color: "#f4f2fa",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 38, fontWeight: 700 }}>
          Equal<span style={{ color: "#a78bfa" }}>ship</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 104, fontWeight: 800, letterSpacing: -3, lineHeight: 1, marginTop: 30 }}>
          <span>Save together.</span>
          <span style={{ color: "#a78bfa" }}>Own together.</span>
        </div>
        <div style={{ display: "flex", fontSize: 34, color: "#a39fb4", marginTop: 36 }}>
          Savings circles on Robinhood Chain. Every save burns $WIF.
        </div>
      </div>
    ),
    size,
  );
}
