import Link from "next/link";
import { ADDR, EXPLORER, REPO } from "@/lib/chain";
import { Logo } from "./Logo";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/circles", label: "Circles" },
      { href: "/markets", label: "Markets" },
      { href: "/wif", label: "$WIF burn" },
      { href: "/proof", label: "Proof of Commitment" },
    ],
  },
  {
    title: "Learn",
    links: [
      { href: "/how", label: "How it works" },
      { href: "/faq", label: "FAQ" },
      { href: "/fees", label: "Fees" },
      { href: "/developers", label: "Developers" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/security", label: "Security" },
      { href: REPO, label: "Source code", external: true },
      { href: "https://x.com/WIFonRH", label: "World is Flat on X", external: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms" },
      { href: "/privacy", label: "Privacy" },
      { href: "/risk", label: "Risk disclosure" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-paper-2">
      <div className="mx-auto max-w-7xl px-4 py-14 md:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-muted">
              Savings circles on Robinhood Chain. Save together, own together.
            </p>
            {ADDR.equalship && (
              <a
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 font-mono text-xs text-muted hover:text-ink"
                href={`${EXPLORER}/address/${ADDR.equalship}`}
                target="_blank"
                rel="noreferrer"
              >
                <span className="live-dot" /> Contract {ADDR.equalship.slice(0, 6)}...{ADDR.equalship.slice(-4)}
              </a>
            )}
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="label">{col.title}</h4>
              <ul className="mt-4 space-y-2.5 text-sm">
                {col.links.map((l) => (
                  <li key={l.href}>
                    {"external" in l && l.external ? (
                      <a className="text-muted hover:text-ink" href={l.href} target="_blank" rel="noreferrer">
                        {l.label}
                      </a>
                    ) : (
                      <Link className="text-muted hover:text-ink" href={l.href}>
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 space-y-3 border-t border-line pt-6 text-xs leading-relaxed text-muted">
          <p>
            Equalship is an independent project built on Robinhood Chain for the World is Flat hackathon. It is not
            affiliated with, endorsed by, or sponsored by Robinhood Markets, Inc. Equalship is not a bank, a broker or
            an investment adviser, and nothing on this site is investment advice.
          </p>
          <p>
            Stock Tokens are not available to US persons and are restricted in some countries. Prices move and you can
            lose money. $WIF comes with no promise of value or return. Read the <Link className="link" href="/risk">risk disclosure</Link>.
          </p>
          <p>Made in the open. {new Date().getFullYear()} Equalship.</p>
        </div>
      </div>
    </footer>
  );
}
