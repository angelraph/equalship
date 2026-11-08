"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@/lib/wallet";
import { robinhoodChain } from "@/lib/chain";
import { short } from "@/lib/format";

const NAV = [
  { href: "/circles", label: "Circles" },
  { href: "/proof", label: "Proof of Commitment" },
  { href: "/how", label: "How it works" },
];

export function Header() {
  const path = usePathname();
  return (
    <header className="border-b border-line bg-paper/90 backdrop-blur sticky top-0 z-20">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Mark />
          <span className="text-lg">Equalship</span>
        </Link>
        <nav className="hidden gap-5 text-sm md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={path?.startsWith(n.href) ? "text-ink" : "text-muted hover:text-ink"}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto">
          <WalletButton />
        </div>
      </div>
      <nav className="flex gap-4 overflow-x-auto border-t border-line px-4 py-2 text-sm md:hidden">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className="whitespace-nowrap text-muted">
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function Mark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <rect x="2" y="13" width="20" height="3" rx="1.5" fill="currentColor" />
      <circle cx="7" cy="8" r="3" fill="var(--color-save)" />
      <circle cx="17" cy="8" r="3" fill="currentColor" />
      <rect x="2" y="18" width="20" height="2" rx="1" fill="currentColor" opacity=".35" />
    </svg>
  );
}

export function WalletButton() {
  const { address, chainId, connecting, hasWallet, connect, disconnect, switchChain } = useWallet();

  if (!address) {
    return (
      <button className="btn btn-primary" disabled={connecting} onClick={() => connect()}>
        {connecting ? "Connecting" : hasWallet ? "Connect wallet" : "Get a wallet"}
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
    <button className="btn" onClick={() => disconnect()} title="Disconnect">
      <span className="h-2 w-2 rounded-full bg-save" />
      <span className="font-mono text-xs">{short(address)}</span>
    </button>
  );
}
