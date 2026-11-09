import type { ReactNode } from "react";
import { Container, PageHero } from "./ui";

/** Shared layout for text pages: hero, then a readable column with an optional side box. */
export function DocPage({
  eyebrow,
  title,
  sub,
  updated,
  aside,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  sub?: ReactNode;
  updated?: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} sub={sub} />
      <Container className={`grid gap-12 py-14 ${aside ? "lg:grid-cols-[1fr_340px]" : ""}`}>
        <article className="prose-eq max-w-3xl">
          {updated && <p className="!text-xs">Last updated {updated}</p>}
          {children}
        </article>
        {aside && <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">{aside}</aside>}
      </Container>
    </>
  );
}
