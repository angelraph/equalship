const STEPS = [
  { t: "Save weekly", s: "USDG in" },
  { t: "Own Stock Tokens", s: "into your wallet" },
  { t: "Burn $WIF", s: "1% fee buys and burns" },
  { t: "Streaks", s: "public proof" },
  { t: "Invite friends", s: "new circles" },
];

/** The Equalship loop drawn as five stops on a ring. */
export function Flywheel() {
  const r = 120;
  const cx = 160;
  const cy = 160;
  return (
    <figure className="card mx-auto w-full max-w-md">
      <svg viewBox="-70 0 460 320" className="w-full" role="img" aria-label="The Equalship flywheel">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-line)" strokeWidth="2" />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--color-save)"
          strokeWidth="2"
          strokeDasharray="6 10"
          className="origin-center animate-[spin_40s_linear_infinite] motion-reduce:animate-none"
          style={{ transformBox: "fill-box" }}
        />
        <text x={cx} y={cy - 6} textAnchor="middle" className="fill-[var(--color-ink)] text-[15px] font-semibold">
          Equalship
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="fill-[var(--color-muted)] text-[11px]">
          every week, again
        </text>
        {STEPS.map((step, i) => {
          const a = (i / STEPS.length) * Math.PI * 2 - Math.PI / 2;
          const x = cx + r * Math.cos(a);
          const y = cy + r * Math.sin(a);
          const burn = step.t.includes("Burn");
          // top stop: label above. upper sides: label outside the ring. lower stops: label below.
          const side = i > 0 && y < cy;
          const anchor = side ? (x > cx ? "start" : "end") : "middle";
          const lx = side ? x + (x > cx ? 16 : -16) : x;
          const ty = side ? y - 2 : y > cy ? y + 26 : y - 30;
          return (
            <g key={step.t}>
              <circle
                cx={x}
                cy={y}
                r="9"
                fill={burn ? "var(--color-burn)" : "var(--color-save)"}
                stroke="var(--color-card)"
                strokeWidth="3"
              />
              <text x={lx} y={ty} textAnchor={anchor} className="fill-[var(--color-ink)] text-[11.5px] font-semibold">
                {step.t}
              </text>
              <text x={lx} y={ty + 14} textAnchor={anchor} className="fill-[var(--color-muted)] text-[10px]">
                {step.s}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
