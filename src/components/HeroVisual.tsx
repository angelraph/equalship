import { LogoMark } from "./Logo";

const MEMBERS = [
  { initials: "AO", tone: "from-[#f472b6] to-[#be185d]" },
  { initials: "KM", tone: "from-[#60a5fa] to-[#1d4ed8]" },
  { initials: "TS", tone: "from-[#fbbf24] to-[#b45309]" },
  { initials: "LB", tone: "from-[#34d399] to-[#047857]" },
  { initials: "RN", tone: "from-[#f87171] to-[#b91c1c]" },
  { initials: "YE", tone: "from-[#a78bfa] to-[#6d28d9]" },
];

/** The Monzo style hero card: a circle of savers orbiting the mark, with live looking activity chips. */
export function HeroVisual() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[520px]">
      <div className="absolute inset-0 rounded-[3rem] border border-line bg-[radial-gradient(circle_at_50%_40%,var(--brand-soft),transparent_65%)]" />
      <div className="absolute inset-[12%] rounded-full border border-dashed border-line-strong" />
      <div className="absolute inset-[26%] rounded-full border border-line" />
      <div className="absolute inset-0 animate-[spin_36s_linear_infinite] motion-reduce:animate-none">
        {MEMBERS.map((m, i) => {
          const a = (i / MEMBERS.length) * Math.PI * 2;
          const x = 50 + 38 * Math.cos(a);
          const y = 50 + 38 * Math.sin(a);
          return (
            <div key={m.initials} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }}>
              <div className="animate-[spin_36s_linear_infinite_reverse] motion-reduce:animate-none">
                <span
                  className={`grid h-12 w-12 place-items-center rounded-full border-2 border-card bg-gradient-to-br ${m.tone} text-xs font-bold text-white shadow-lg`}
                >
                  {m.initials}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="absolute left-1/2 top-1/2 grid h-36 w-36 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[2.2rem] border border-line bg-card shadow-[0_30px_80px_-20px_var(--glow)]">
        <LogoMark size={92} />
      </div>
      <Chip className="left-[2%] top-[14%] [animation-delay:0s]">
        <span className="h-2 w-2 rounded-full bg-up" /> Ada saved $10, bought NVDA
      </Chip>
      <Chip className="right-[0%] top-[42%] [animation-delay:1.2s]">
        <span className="text-burn">&#9679;</span> 117 $WIF burned
      </Chip>
      <Chip className="bottom-[10%] left-[8%] [animation-delay:2.1s]">
        <span className="text-brand-2">&#9733;</span> 12 week streak
      </Chip>
    </div>
  );
}

function Chip({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <div
      className={`absolute flex animate-[float_5s_ease-in-out_infinite] items-center gap-2 rounded-full border border-line bg-card/90 px-3.5 py-2 text-xs font-medium shadow-xl backdrop-blur motion-reduce:animate-none ${className}`}
    >
      {children}
    </div>
  );
}
