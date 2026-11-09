"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { EXPLORER, robinhoodChain } from "@/lib/chain";
import { short } from "@/lib/format";
import { useWallet } from "@/lib/wallet";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { WalletModal } from "./WalletModal";

export const NAV = [
  { href: "/circles", label: "Circles" },
  { href: "/markets", label: "Markets" },
  { href: "/wif", label: "$WIF" },
  { href: "/proof", label: "Proof" },
];

export const LEARN = [
  { href: "/how", label: "How it works", note: "From first save to payout" },
  { href: "/faq", label: "FAQ", note: "Straight answers" },
  { href: "/security", label: "Security", note: "What protects your money" },
  { href: "/fees", label: "Fees", note: "One fee, and where it goes" },
  { href: "/developers", label: "Developers", note: "Contracts and the registry" },
  { href: "/about", label: "About", note: "Why we built this" },
];

export function Header() {
  const path = usePathname();
  const [menu, setMenu] = useState(false);
  const [learn, setLearn] = useState(false);
  const learnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (learnRef.current && !learnRef.current.contains(e.target as Node)) setLearn(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const active = (href: string) => path === href || path?.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:px-6">
        <Logo />
        <nav className="ml-6 hidden items-center gap-1 rounded-full border border-line bg-card/60 p-1 text-sm lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`rounded-full px-4 py-1.5 transition ${active(n.href) ? "bg-ink text-paper" : "text-muted hover:text-ink"}`}
            >
              {n.label}
            </Link>
          ))}
          <div className="relative" ref={learnRef}>
            <button
              onClick={() => setLearn((v) => !v)}
              className={`flex items-center gap-1 rounded-full px-4 py-1.5 transition ${LEARN.some((l) => active(l.href)) ? "bg-ink text-paper" : "text-muted hover:text-ink"}`}
              aria-expanded={learn}
            >
              Learn
              <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
                <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
            </button>
            {learn && (
              <div className="rise absolute left-1/2 top-11 w-[420px] -translate-x-1/2 rounded-3xl border border-line bg-card p-2 shadow-2xl">
                <div className="grid grid-cols-2 gap-1">
                  {LEARN.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setLearn(false)}
                      className="rounded-2xl p-3 transition hover:bg-card-2"
                    >
                      <p className="text-sm font-semibold">{l.label}</p>
                      <p className="text-xs text-muted">{l.note}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <WalletButton />
          <button
            className="btn btn-ghost px-3 lg:hidden"
            onClick={() => setMenu((v) => !v)}
            aria-label="Menu"
            aria-expanded={menu}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
              <path d={menu ? "M4 4l10 10M14 4L4 14" : "M2 5h14M2 9h14M2 13h14"} stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
        </div>
      </div>
      {menu && (
        <nav className="rise border-t border-line px-4 pb-5 pt-3 lg:hidden">
          <div className="grid grid-cols-2 gap-2">
            {[...NAV, ...LEARN].map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setMenu(false)}
                className={`rounded-2xl border border-line px-4 py-3 text-sm ${active(n.href) ? "bg-ink text-paper" : "bg-card"}`}
              >
                {n.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
      <WalletModal />
    </header>
  );
}

export function WalletButton({ big = false }: { big?: boolean }) {
  const { address, chainId, wallet, connecting, connect, disconnect, switchChain } = useWallet();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  if (!address) {
    return (
      <button className={`btn btn-primary ${big ? "px-7 py-3.5 text-base" : ""}`} disabled={connecting} onClick={() => connect()}>
        {connecting ? (
          "Connecting"
        ) : big ? (
          "Connect wallet"
        ) : (
          <>
            <span className="sm:hidden">Connect</span>
            <span className="hidden sm:inline">Connect wallet</span>
          </>
        )}
      </button>
    );
  }
  if (chainId !== robinhoodChain.id) {
    return (
      <button className="btn btn-warn" onClick={() => switchChain()}>
        Switch to Robinhood Chain
      </button>
    );
  }
  return (
    <div className="relative" ref={ref}>
      <button className="btn gap-2.5 pl-2" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        {wallet?.icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={wallet.icon} alt="" className="h-6 w-6 rounded-full" />
        ) : (
          <span className="h-6 w-6 rounded-full bg-gradient-to-br from-brand-2 to-brand-deep" />
        )}
        <span className="font-mono text-xs">{short(address)}</span>
      </button>
      {open && (
        <div className="rise absolute right-0 top-12 w-64 rounded-3xl border border-line bg-card p-2 shadow-2xl">
          <div className="px-3 py-2">
            <p className="text-xs text-muted">Connected with {wallet?.name ?? "wallet"}</p>
            <p className="mt-1 font-mono text-sm">{short(address)}</p>
          </div>
          <MenuItem
            onClick={async () => {
              await navigator.clipboard.writeText(address);
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            }}
          >
            {copied ? "Address copied" : "Copy address"}
          </MenuItem>
          <MenuItem href={`/proof?address=${address}`}>My Proof of Commitment</MenuItem>
          <MenuItem href={`${EXPLORER}/address/${address}`} external>
            View on Blockscout
          </MenuItem>
          <MenuItem
            onClick={async () => {
              setOpen(false);
              await disconnect();
              connect();
            }}
          >
            Switch wallet
          </MenuItem>
          <MenuItem
            danger
            onClick={async () => {
              setOpen(false);
              await disconnect();
            }}
          >
            Disconnect
          </MenuItem>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  children,
  onClick,
  href,
  external,
  danger,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  external?: boolean;
  danger?: boolean;
}) {
  const cls = `block w-full rounded-2xl px-3 py-2.5 text-left text-sm transition hover:bg-card-2 ${danger ? "text-down" : ""}`;
  if (href && external)
    return (
      <a className={cls} href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  if (href)
    return (
      <Link className={cls} href={href}>
        {children}
      </Link>
    );
  return (
    <button className={cls} onClick={onClick}>
      {children}
    </button>
  );
}
