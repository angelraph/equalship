import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Providers } from "@/components/Providers";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-mono-face", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Equalship: save together, own together",
  description:
    "Savings circles on Robinhood Chain. Friends put in a small amount of USDG every week, it buys Stock Tokens into each member's own wallet, and $WIF is the bond, the vote and the burn.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="flex min-h-screen flex-col">
        <Providers>
          <Header />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
          <footer className="border-t border-line">
            <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-muted md:flex-row md:justify-between">
              <p>
                Equalship is an independent project built on Robinhood Chain. It is not affiliated with or endorsed
                by Robinhood Markets, Inc. Stock Tokens are not available to US persons or in restricted regions.
                $WIF has no promise of value or return.
              </p>
              <div className="flex shrink-0 gap-4 whitespace-nowrap">
                <Link className="link" href="/how">
                  How it works
                </Link>
                <a className="link" href="https://github.com/angelraph/equalship" target="_blank" rel="noreferrer">
                  Source
                </a>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
