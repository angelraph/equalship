import Link from "next/link";
import { Accordion } from "@/components/Accordion";
import { Carousel, type Slide } from "@/components/Carousel";
import { HeroVisual } from "@/components/HeroVisual";
import { LiveStats } from "@/components/LiveStats";
import { MarketGrid, Ticker } from "@/components/MarketBits";
import { Container, Icon, LearnMore, SectionHead } from "@/components/ui";
import { ADDR, REPO } from "@/lib/chain";
import { FAQ_TEASER } from "@/lib/faq";

const CHIPS = [
  { icon: "users", label: "Save with friends" },
  { icon: "chart", label: "Own Stock Tokens" },
  { icon: "flame", label: "Every save burns $WIF" },
  { icon: "lock", label: "Your wallet, your assets" },
];

const STEPS = [
  {
    n: "Step 1",
    icon: "users",
    title: "Start or join a circle",
    body: "Pick the amount, how often you pay, the $WIF bond and a basket of up to five assets. Share the invite link with your people.",
  },
  {
    n: "Step 2",
    icon: "wallet",
    title: "Save every period",
    body: "One tap buys the basket straight into your wallet on Uniswap. Your streak grows with every period you keep.",
  },
  {
    n: "Step 3",
    icon: "shield",
    title: "Stay, or pay for leaving",
    body: "Your bond comes back whenever you leave. Circles that turn on slashing take part of it for a missed period: half burned, half paid to the members who stayed.",
  },
];

const SLIDES: Slide[] = [
  {
    href: "/circles",
    title: "Circles",
    body: "Group savings with a shared schedule and a shared goal. From 1 USDG a period.",
    icon: "users",
    tone: "from-[#8b5cf6] to-[#4c1d95]",
    stat: "Save together",
  },
  {
    href: "/markets",
    title: "Markets",
    body: "Live prices and 24 hour charts for every asset a circle can buy.",
    icon: "chart",
    tone: "from-[#0ea5e9] to-[#1e3a8a]",
    stat: "8 live assets",
  },
  {
    href: "/wif",
    title: "$WIF burn",
    body: "Bonds lock it, missed weeks burn it, votes burn it, fees buy it back and burn it.",
    icon: "flame",
    tone: "from-[#fb923c] to-[#9a3412]",
    stat: "4 ways to burn",
  },
  {
    href: "/proof",
    title: "Proof of Commitment",
    body: "A public record of who really saves. Any app can read it to filter farmed wallets.",
    icon: "check",
    tone: "from-[#10b981] to-[#065f46]",
    stat: "One call",
  },
  {
    href: "/circles",
    title: "Sponsor a friend",
    body: "Pay a newcomer's $WIF bond so they can start saving with only USDG.",
    icon: "gift",
    tone: "from-[#ec4899] to-[#831843]",
    stat: "Bring one in",
  },
  {
    href: "/how",
    title: "Basket votes",
    body: "Members change what the circle buys by burning $WIF. One $WIF, one vote.",
    icon: "vote",
    tone: "from-[#6366f1] to-[#312e81]",
    stat: "1 $WIF = 1 vote",
  },
];

const BENTO = [
  {
    span: "md:col-span-2",
    title: "No custody, by design",
    body: "Swaps send Stock Tokens to the member in the same transaction. The contract never holds them, so there is nothing to withdraw and nothing to lose.",
    href: "/security",
    icon: "lock",
  },
  {
    span: "",
    title: "Exact approvals",
    body: "Every approval is for the exact amount of the action. Never unlimited.",
    href: "/security",
    icon: "shield",
  },
  {
    span: "",
    title: "Join with just ETH",
    body: "No USDG or $WIF needed to start. Your ETH buys the $WIF bond on Uniswap, so every new saver is a $WIF buyer.",
    href: "/circles",
    icon: "clock",
  },
  {
    span: "md:col-span-2",
    title: "Auto-save, so you never miss a week",
    body: "Turn it on once and the keeper saves for you every period, straight into your wallet, from a USDG approval you can remove any time. Late? There is a grace window before a period counts as missed.",
    href: "/how",
    icon: "users",
  },
];

const TRUST = [
  { icon: "code", title: "Open source", body: "Every line of the contract and app is public on GitHub." },
  { icon: "eye", title: "Readable onchain", body: "Every save, slash, vote and burn is a public transaction." },
  { icon: "check", title: "Tested on real state", body: "Fork tests buy real Stock Tokens through live mainnet pools." },
  { icon: "lock", title: "You hold your assets", body: "Stock Tokens land in your wallet, never in ours." },
  { icon: "shield", title: "Capped fee", body: "The fee is 1% and the contract refuses anything above 2%." },
  { icon: "globe", title: "Region aware", body: "Stock Token buyers confirm eligibility. WETH baskets work everywhere." },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-48 left-1/2 h-[36rem] w-[70rem] -translate-x-1/2 rounded-full bg-brand/25 blur-[140px]" />
        <Container className="relative grid items-center gap-12 py-16 md:py-24 lg:grid-cols-[1.05fr_1fr]">
          <div className="text-center lg:text-left">
            <span className="eyebrow rise">
              <span className="live-dot" /> Live on Robinhood Chain mainnet
            </span>
            <h1 className="display rise mt-6 text-[3.4rem] leading-[0.95] sm:text-7xl xl:text-[5.6rem] [animation-delay:60ms]">
              Save together.
              <br />
              <span className="serif-accent text-brand-2">Own</span> together.
            </h1>
            <p className="rise mx-auto mt-6 max-w-xl text-lg text-muted lg:mx-0 [animation-delay:120ms]">
              Equalship turns a group chat into a savings circle. Put in a few dollars every week with friends, own a
              slice of NVIDIA, Apple or the S&amp;P 500, and keep each other honest with a $WIF bond.
            </p>
            <div className="rise mt-8 flex flex-wrap justify-center gap-3 lg:justify-start [animation-delay:180ms]">
              <Link href="/circles" className="btn btn-primary px-7 py-3.5 text-base">
                Start saving
              </Link>
              <Link href="/how" className="btn px-7 py-3.5 text-base">
                How it works
              </Link>
            </div>
            <div className="rise mt-10 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-muted lg:justify-start [animation-delay:240ms]">
              {CHIPS.map((c) => (
                <span key={c.label} className="flex items-center gap-2">
                  <Icon name={c.icon} className="h-4 w-4 text-brand-2" />
                  {c.label}
                </span>
              ))}
            </div>
          </div>
          <div className="rise [animation-delay:200ms]">
            <HeroVisual />
          </div>
        </Container>
      </section>

      <Ticker />

      <Container className="py-14">
        <LiveStats />
      </Container>

      {/* Three steps */}
      <section className="py-16">
        <Container>
          <SectionHead
            eyebrow="How it works"
            title="Three steps from first save to real ownership"
            sub="The oldest way to save, rebuilt on a public ledger."
          />
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="card relative overflow-hidden p-7">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-soft text-brand-2">
                    <Icon name={s.icon} />
                  </span>
                  <span className="label">{s.n}</span>
                </div>
                <h3 className="display mt-6 text-2xl">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Product carousel */}
      <section className="py-16">
        <Container>
          <SectionHead
            align="left"
            eyebrow="Everything in one place"
            title={
              <>
                Get the most out of <span className="serif-accent text-brand-2">every</span> save
              </>
            }
            sub="A savings circle, a market screen, a burn engine and a public reputation, working as one loop."
          />
          <div className="mt-6">
            <Carousel slides={SLIDES} />
          </div>
        </Container>
      </section>

      {/* Markets */}
      <section className="py-16">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHead
              align="left"
              eyebrow="Live markets"
              title="What your circle can own"
              sub="Real prices from the pools your circle buys through, updated as you watch."
            />
            <Link href="/markets" className="btn">
              All markets
            </Link>
          </div>
          <div className="mt-10">
            <MarketGrid />
          </div>
        </Container>
      </section>

      {/* Bento */}
      <section className="py-16">
        <Container>
          <SectionHead eyebrow="Details that matter" title="Built so you never have to trust us" />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {BENTO.map((b) => (
              <div key={b.title} className={`panel flex flex-col justify-between p-8 ${b.span}`}>
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-card text-brand-2">
                  <Icon name={b.icon} />
                </span>
                <div className="mt-10">
                  <h3 className="display text-2xl">{b.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{b.body}</p>
                  <div className="mt-4">
                    <LearnMore href={b.href} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Dark builders band */}
      <section className="py-16">
        <Container>
          <div className="overflow-hidden rounded-[2.5rem] border border-line bg-[#07060b] p-8 text-[#f4f2fa] md:p-14">
            <div className="max-w-2xl">
              <span className="eyebrow border-white/10 bg-white/5 text-white/70">For $WIF holders and builders</span>
              <h2 className="display mt-4 text-4xl md:text-5xl">
                A savings habit that <span className="serif-accent text-[#c4b5fd]">burns</span> $WIF
              </h2>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <h3 className="font-semibold">Bonds lock supply</h3>
                <p className="mt-2 text-sm text-white/60">Every member locks $WIF for as long as they save. More savers, more $WIF off the market.</p>
                <div className="mt-6 flex h-24 items-end gap-1.5">
                  {[30, 42, 38, 55, 61, 58, 72, 80, 77, 92].map((h, i) => (
                    <span key={i} className="flex-1 rounded-t bg-gradient-to-t from-[#6d28d9] to-[#a78bfa]" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <h3 className="font-semibold">Four burn paths</h3>
                <ul className="mt-3 space-y-2.5 text-sm text-white/60">
                  <li className="flex justify-between"><span>1% fee buyback</span><span className="font-mono text-[#ff7a45]">daily</span></li>
                  <li className="flex justify-between"><span>Missed period slash</span><span className="font-mono text-[#ff7a45]">50%</span></li>
                  <li className="flex justify-between"><span>Every join with ETH</span><span className="font-mono text-[#ff7a45]">buys</span></li>
                  <li className="flex justify-between"><span>Basket votes</span><span className="font-mono text-[#ff7a45]">100%</span></li>
                  <li className="flex justify-between"><span>Every burn</span><span className="font-mono text-[#ff7a45]">public</span></li>
                </ul>
                <Link href="/wif" className="mt-6 inline-block text-sm font-semibold text-[#c4b5fd]">
                  Live burn stats &rarr;
                </Link>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <h3 className="font-semibold">Read who really saves</h3>
                <p className="mt-2 text-sm text-white/60">One call tells any contract if a wallet is a committed saver.</p>
                <pre className="mt-4 overflow-x-auto rounded-2xl bg-black/50 p-4 font-mono text-[11px] leading-relaxed text-[#c4b5fd]">
{`isCommitted(
  voter,
  4,       // periods paid
  4,       // best streak
  8 days   // max idle
) -> true`}
                </pre>
                <Link href="/developers" className="mt-4 inline-block text-sm font-semibold text-[#c4b5fd]">
                  Developer docs &rarr;
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Trust grid */}
      <section className="py-16">
        <Container>
          <SectionHead
            eyebrow="Security"
            title={
              <>
                Safe by design. <span className="serif-accent text-brand-2">Open</span> by choice.
              </>
            }
          />
          <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {TRUST.map((t) => (
              <div key={t.title} className="flex gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-line bg-card text-brand-2">
                  <Icon name={t.icon} />
                </span>
                <div>
                  <h3 className="font-semibold">{t.title}</h3>
                  <p className="mt-1 text-sm text-muted">{t.body}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <LearnMore href="/security">Read the security page</LearnMore>
          </div>
        </Container>
      </section>

      {/* FAQ teaser */}
      <section className="py-16">
        <Container className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHead
            align="left"
            eyebrow="FAQ"
            title="Questions? We have answers."
            sub="From what a savings circle is to where your money sits."
          >
            <Link href="/faq" className="btn btn-primary">
              Read the FAQ
            </Link>
          </SectionHead>
          <Accordion items={FAQ_TEASER} />
        </Container>
      </section>

      {/* CTA band */}
      <section className="py-16">
        <Container>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#8b5cf6] via-[#7c3aed] to-[#4c1d95] px-8 py-16 text-center text-white md:py-20">
            <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
            <h2 className="display mx-auto max-w-2xl text-4xl md:text-6xl">Run your next savings circle onchain.</h2>
            <p className="mx-auto mt-4 max-w-xl text-white/80">
              Start with a few dollars and the people you already trust. Your first save takes under a minute.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/circles" className="btn border-transparent bg-white px-7 py-3.5 text-base text-[#4c1d95] hover:opacity-90">
                Start a circle
              </Link>
              <a href={REPO} target="_blank" rel="noreferrer" className="btn border-white/30 bg-transparent px-7 py-3.5 text-base text-white hover:border-white">
                Read the code
              </a>
            </div>
            {ADDR.equalship && <p className="mt-6 font-mono text-xs text-white/60">Contract {ADDR.equalship}</p>}
          </div>
        </Container>
      </section>
    </>
  );
}
