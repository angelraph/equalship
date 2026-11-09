"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { errorText } from "@/lib/format";
import { useWallet, useWallets, type WalletInfo } from "@/lib/wallet";
import { LogoMark } from "./Logo";

const GET_WALLETS = [
  { name: "MetaMask", href: "https://metamask.io/download/" },
  { name: "Rabby", href: "https://rabby.io/" },
  { name: "Coinbase Wallet", href: "https://www.coinbase.com/wallet/downloads" },
];

/** Lists every wallet the browser announced (EIP-6963). Opens from any Connect button. */
export function WalletModal() {
  const { pickerOpen, closePicker, connect, connecting } = useWallet();
  const wallets = useWallets();
  const [error, setError] = useState("");
  const [pending, setPending] = useState<string>();

  useEffect(() => {
    if (!pickerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closePicker();
    window.addEventListener("keydown", onKey);
    // keep the page behind the dialog still
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [pickerOpen, closePicker]);

  if (!pickerOpen) return null;

  async function pick(w: WalletInfo) {
    setError("");
    setPending(w.rdns);
    try {
      await connect(w);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setPending(undefined);
    }
  }

  // Rendered on document.body: the header uses backdrop-filter, which would otherwise
  // become the containing block for this fixed overlay and clip it to the header.
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center" onClick={closePicker}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Connect a wallet"
        className="rise max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-[2rem] border border-line bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <LogoMark size={36} />
            <div>
              <h2 className="display text-xl">Connect a wallet</h2>
              <p className="text-xs text-muted">Robinhood Chain, chain id 4663</p>
            </div>
          </div>
          <button className="btn btn-ghost h-9 w-9 p-0" onClick={closePicker} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
        </div>

        <div className="mt-6 space-y-2">
          {wallets.length === 0 && (
            <div className="rounded-2xl border border-line bg-paper p-4 text-sm text-muted">
              No browser wallet found. Install one, then reload this page.
              <div className="mt-3 flex flex-wrap gap-2">
                {GET_WALLETS.map((g) => (
                  <a key={g.name} className="pill" href={g.href} target="_blank" rel="noreferrer">
                    {g.name}
                  </a>
                ))}
              </div>
            </div>
          )}
          {wallets.map((w) => (
            <button
              key={w.rdns}
              disabled={connecting}
              onClick={() => pick(w)}
              className="flex w-full items-center gap-3 rounded-2xl border border-line bg-paper px-4 py-3 text-left transition hover:border-brand disabled:opacity-60"
            >
              {w.icon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={w.icon} alt="" className="h-9 w-9 rounded-xl" />
              ) : (
                <span className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-2 to-brand-deep" />
              )}
              <span className="flex-1">
                <span className="block font-semibold">{w.name}</span>
                <span className="block text-xs text-muted">{w.rdns === "injected" ? "Browser wallet" : "Detected"}</span>
              </span>
              <span className="text-xs text-muted">{pending === w.rdns ? "Check your wallet" : "Connect"}</span>
            </button>
          ))}
        </div>
        {error && <p className="mt-3 text-sm text-down">{error}</p>}

        <p className="mt-6 text-xs leading-relaxed text-muted">
          Equalship only asks your wallet for your address and, when you act, for a transaction you can read before
          signing. Approvals are always for the exact amount. <Link className="link" href="/security" onClick={closePicker}>How we keep you safe</Link>
        </p>
      </div>
    </div>,
    document.body,
  );
}
