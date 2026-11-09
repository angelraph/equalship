import type { Metadata, Viewport } from "next";
import { Instrument_Serif, JetBrains_Mono, Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Providers } from "@/components/Providers";
import { themeScript } from "@/components/ThemeToggle";
import "./globals.css";

const display = Space_Grotesk({ variable: "--font-display-face", subsets: ["latin"], weight: ["500", "700"] });
const body = Plus_Jakarta_Sans({ variable: "--font-body", subsets: ["latin"] });
const serif = Instrument_Serif({ variable: "--font-serif-face", subsets: ["latin"], weight: "400", style: ["italic"] });
const mono = JetBrains_Mono({ variable: "--font-mono-face", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://equalship.vercel.app"),
  title: { default: "Equalship: save together, own together", template: "%s | Equalship" },
  description:
    "Savings circles on Robinhood Chain. Friends put in a small amount of USDG every week, it buys Stock Tokens into each member's own wallet, and $WIF is the bond, the vote and the burn.",
  openGraph: {
    title: "Equalship: save together, own together",
    description: "Savings circles that buy Stock Tokens into your own wallet, held together by $WIF.",
    url: "https://equalship.vercel.app",
    siteName: "Equalship",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Equalship", description: "Save together. Own together." },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0a10" },
    { media: "(prefers-color-scheme: light)", color: "#faf9fc" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} ${serif.variable} ${mono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <Providers>
          <Header />
          <main className="w-full flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
