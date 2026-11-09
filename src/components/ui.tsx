import Link from "next/link";
import type { ReactNode } from "react";

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-7xl px-4 md:px-6 ${className}`}>{children}</div>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="eyebrow">{children}</span>;
}

/** Centered section heading in the Jamiya and Monzo style: eyebrow, big title, short line. */
export function SectionHead({
  eyebrow,
  title,
  sub,
  align = "center",
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  sub?: ReactNode;
  align?: "center" | "left";
  children?: ReactNode;
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="display mt-4 text-4xl leading-[1.05] md:text-5xl">{title}</h2>
      {sub && <p className="mt-4 text-lg text-muted">{sub}</p>}
      {children && <div className={`mt-7 flex flex-wrap gap-3 ${align === "center" ? "justify-center" : ""}`}>{children}</div>}
    </div>
  );
}

/** Top of every inner page. */
export function PageHero({ eyebrow, title, sub, children }: { eyebrow: string; title: ReactNode; sub?: ReactNode; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-line">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[60rem] -translate-x-1/2 rounded-full bg-brand/20 blur-[120px]" />
      <Container className="relative py-16 md:py-20">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="display rise mt-5 max-w-4xl text-5xl leading-[1.02] md:text-7xl">{title}</h1>
        {sub && <p className="rise mt-5 max-w-2xl text-lg text-muted [animation-delay:80ms]">{sub}</p>}
        {children && <div className="rise mt-8 flex flex-wrap gap-3 [animation-delay:140ms]">{children}</div>}
      </Container>
    </section>
  );
}

export function LearnMore({ href, children = "Learn more" }: { href: string; children?: ReactNode }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-1.5 text-sm font-semibold text-brand-2">
      {children}
      <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
    </Link>
  );
}

export function Icon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  const p = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const paths: Record<string, ReactNode> = {
    users: (
      <>
        <circle cx="9" cy="8" r="3.2" {...p} />
        <path d="M3 19c.8-3.2 3.2-5 6-5s5.2 1.8 6 5" {...p} />
        <circle cx="17" cy="9" r="2.5" {...p} />
        <path d="M16.5 14c2.4.2 4 1.7 4.5 4" {...p} />
      </>
    ),
    lock: (
      <>
        <rect x="4.5" y="10" width="15" height="10" rx="2.5" {...p} />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" {...p} />
      </>
    ),
    flame: <path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5.3 1.5 1 2.5 2 3 0-3 0-5.5 1-8.5z" {...p} />,
    chart: <path d="M4 19h16M6 15l4-4 3 3 5-6" {...p} />,
    vote: (
      <>
        <rect x="4" y="11" width="16" height="9" rx="2" {...p} />
        <path d="M8 11l3-6 5 2-2 4" {...p} />
      </>
    ),
    shield: <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z M9 12l2 2 4-4" {...p} />,
    wallet: (
      <>
        <rect x="3" y="6" width="18" height="13" rx="3" {...p} />
        <path d="M16 12.5h2M3 9h15a3 3 0 0 1 3 3" {...p} />
      </>
    ),
    link: <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" {...p} />,
    eye: (
      <>
        <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" {...p} />
        <circle cx="12" cy="12" r="3" {...p} />
      </>
    ),
    code: <path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14" {...p} />,
    globe: (
      <>
        <circle cx="12" cy="12" r="8.5" {...p} />
        <path d="M3.5 12h17M12 3.5c2.5 2.5 3.5 5.5 3.5 8.5s-1 6-3.5 8.5c-2.5-2.5-3.5-5.5-3.5-8.5s1-6 3.5-8.5z" {...p} />
      </>
    ),
    gift: (
      <>
        <rect x="4" y="9" width="16" height="11" rx="2" {...p} />
        <path d="M12 9v11M4 13h16M12 9c-2-4-6-4-6-1.5S10 9 12 9zm0 0c2-4 6-4 6-1.5S14 9 12 9z" {...p} />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="8.5" {...p} />
        <path d="M12 7.5V12l3 2" {...p} />
      </>
    ),
    check: <path d="M5 12.5l4.5 4.5L19 7.5" {...p} />,
    spark: <path d="M12 3l2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2z" {...p} />,
  };
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      {paths[name] ?? paths.spark}
    </svg>
  );
}
