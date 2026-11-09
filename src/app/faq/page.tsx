import type { Metadata } from "next";
import Link from "next/link";
import { Accordion } from "@/components/Accordion";
import { Container, PageHero } from "@/components/ui";
import { FAQ_GROUPS } from "@/lib/faq";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers about Equalship savings circles, custody, $WIF, Stock Tokens and safety.",
};

export default function FaqPage() {
  return (
    <>
      <PageHero
        eyebrow="FAQ"
        title={
          <>
            Questions? We have <span className="serif-accent text-brand-2">answers</span>.
          </>
        }
        sub="Everything people ask before joining their first circle."
      />
      <Container className="grid gap-12 py-14 lg:grid-cols-[220px_1fr]">
        <nav className="hidden lg:block">
          <ul className="sticky top-24 space-y-2 text-sm">
            {FAQ_GROUPS.map((g) => (
              <li key={g.title}>
                <a className="text-muted hover:text-ink" href={`#${g.title.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
                  {g.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-12">
          {FAQ_GROUPS.map((g) => (
            <section key={g.title} id={g.title.toLowerCase().replace(/[^a-z]+/g, "-")} className="scroll-mt-24">
              <h2 className="display mb-5 text-2xl">{g.title}</h2>
              <Accordion items={g.items} defaultOpen={null} />
            </section>
          ))}
          <div className="panel p-8">
            <h2 className="display text-2xl">Still stuck?</h2>
            <p className="mt-2 text-muted">
              Read <Link className="link" href="/how">how it works</Link>, check the <Link className="link" href="/security">security page</Link>,
              or open an issue on <a className="link" href="https://github.com/angelraph/equalship/issues" target="_blank" rel="noreferrer">GitHub</a>.
            </p>
          </div>
        </div>
      </Container>
    </>
  );
}
