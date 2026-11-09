import Link from "next/link";

/** The Equalship mark: three savers above an E, held in an orbit. Vector version of the brand logo. */
export function LogoMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" className={className} aria-hidden>
      <defs>
        <linearGradient id="eq-white" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#DCD3F7" />
        </linearGradient>
        <linearGradient id="eq-purple" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#A78BFA" />
          <stop offset="1" stopColor="#6D28D9" />
        </linearGradient>
        <linearGradient id="eq-orbit" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#5B21B6" stopOpacity=".2" />
          <stop offset=".6" stopColor="#7C3AED" />
          <stop offset="1" stopColor="#C4B5FD" />
        </linearGradient>
      </defs>
      {/* orbit, back half */}
      <path d="M18 92 C 4 70, 40 44, 92 40" fill="none" stroke="url(#eq-orbit)" strokeWidth="5" strokeLinecap="round" opacity=".55" />
      {/* savers */}
      <circle cx="44" cy="25" r="7" fill="url(#eq-purple)" />
      <path d="M31 44 a13 11 0 0 1 26 0 z" fill="url(#eq-purple)" />
      <circle cx="84" cy="25" r="7" fill="url(#eq-white)" />
      <path d="M71 44 a13 11 0 0 1 26 0 z" fill="url(#eq-white)" />
      <circle cx="64" cy="18" r="9" fill="url(#eq-white)" />
      <path d="M47 44 a17 14 0 0 1 34 0 z" fill="url(#eq-white)" />
      {/* the E */}
      <path
        d="M96 46 H56 Q30 46 30 72 V86 Q30 112 56 112 H96 Q104 112 106 104 L108 97 H58 Q46 97 46 86 V72 Q46 61 58 61 H100 Z"
        fill="url(#eq-white)"
      />
      <path d="M56 69 H98 L94 81 H56 Q52 81 52 77 V73 Q52 69 56 69 Z" fill="url(#eq-purple)" />
      {/* growth bars */}
      <rect x="62" y="88" width="5" height="5" rx="1" fill="#8B5CF6" />
      <rect x="70" y="86" width="5" height="7" rx="1" fill="#8B5CF6" />
      <rect x="78" y="84" width="5" height="9" rx="1" fill="#8B5CF6" />
      {/* orbit, front half and spark */}
      <path d="M18 92 C 30 112, 84 100, 118 58" fill="none" stroke="url(#eq-orbit)" strokeWidth="5" strokeLinecap="round" />
      <path d="M118 50 l2.4 6 6 2.4 -6 2.4 -2.4 6 -2.4 -6 -6 -2.4 6 -2.4z" fill="#EDE9FE" />
    </svg>
  );
}

export function Logo({ size = 30, href = "/" }: { size?: number; href?: string }) {
  return (
    <Link href={href} className="group flex items-center gap-2.5" aria-label="Equalship home">
      <LogoMark size={size} className="transition-transform duration-500 group-hover:rotate-[-8deg]" />
      <span className="font-display text-[1.2rem] font-bold tracking-tight">
        Equal<span className="text-brand">ship</span>
      </span>
    </Link>
  );
}
