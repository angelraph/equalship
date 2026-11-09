"use client";

import { useId, useMemo, useRef, useState } from "react";
import type { Candle } from "@/lib/market";
import { money } from "@/lib/useMarket";

function scale(candles: Candle[], w: number, h: number, pad = 4) {
  const ys = candles.map((c) => c.c);
  const min = Math.min(...ys);
  const max = Math.max(...ys);
  const span = max - min || max * 0.01 || 1;
  const t0 = candles[0].t;
  const t1 = candles[candles.length - 1].t;
  const tspan = t1 - t0 || 1;
  const pts = candles.map((c) => ({
    x: ((c.t - t0) / tspan) * w,
    y: pad + (1 - (c.c - min) / span) * (h - pad * 2),
    c,
  }));
  return { pts, min, max };
}

function pathOf(pts: { x: number; y: number }[]) {
  return pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
}

/** Small trend line for tables and tickers. */
export function Sparkline({ candles, width = 96, height = 32 }: { candles?: Candle[]; width?: number; height?: number }) {
  const id = useId();
  if (!candles || candles.length < 2) return <div style={{ width, height }} className="rounded bg-card-2" />;
  const up = candles[candles.length - 1].c >= candles[0].c;
  const { pts } = scale(candles, width, height, 3);
  const line = pathOf(pts);
  const color = up ? "var(--up)" : "var(--down)";
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity=".28" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${width} ${height} L0 ${height} Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

/** Full price chart with a hover crosshair, used on market pages. */
export function PriceChart({ candles, height = 320 }: { candles?: Candle[]; height?: number }) {
  const id = useId();
  const ref = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const W = 1000;
  const H = height;

  const data = useMemo(() => (candles && candles.length > 1 ? scale(candles, W, H, 18) : null), [candles, H]);
  if (!data) {
    return (
      <div style={{ height }} className="flex items-center justify-center rounded-3xl bg-card-2 text-sm text-muted">
        Loading live prices
      </div>
    );
  }
  const { pts, min, max } = data;
  const up = pts[pts.length - 1].c.c >= pts[0].c.c;
  const color = up ? "var(--up)" : "var(--down)";
  const line = pathOf(pts);
  const h = hover !== null ? pts[hover] : null;

  function onMove(e: React.PointerEvent) {
    const r = ref.current!.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    let best = 0;
    for (let i = 1; i < pts.length; i++) if (Math.abs(pts[i].x - x) < Math.abs(pts[best].x - x)) best = i;
    setHover(best);
  }

  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-0 top-0 z-10 font-mono text-xs text-muted">
        {h ? (
          <span>
            <span className="text-sm font-semibold text-ink">{money(h.c.c)}</span>{" "}
            {new Date(h.c.t).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </span>
        ) : (
          <span>
            High {money(max)}, low {money(min)}
          </span>
        )}
      </div>
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-auto w-full touch-none select-none"
        style={{ height }}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label="Price chart for the last 24 hours"
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity=".25" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="var(--line)" strokeDasharray="4 6" vectorEffect="non-scaling-stroke" />
        ))}
        <path d={`${line} L${W} ${H} L0 ${H} Z`} fill={`url(#${id})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="2.2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        {h && (
          <>
            <line x1={h.x} x2={h.x} y1="0" y2={H} stroke="var(--muted)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <circle cx={h.x} cy={h.y} r="5" fill={color} stroke="var(--card)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </>
        )}
        <circle cx={pts[pts.length - 1].x - 2} cy={pts[pts.length - 1].y} r="4" fill={color}>
          <animate attributeName="r" values="4;8;4" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;.3;1" dur="1.8s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}
