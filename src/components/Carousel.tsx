"use client";

import Link from "next/link";
import { useRef } from "react";
import { Icon } from "./ui";

export type Slide = { href: string; title: string; body: string; icon: string; tone: string; stat: string };

/** Monzo style row of large product cards with arrow buttons. */
export function Carousel({ slides }: { slides: Slide[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const go = (dir: number) => ref.current?.scrollBy({ left: dir * (ref.current.clientWidth * 0.8), behavior: "smooth" });
  return (
    <div>
      <div className="mb-6 flex justify-end gap-2">
        <button className="btn h-11 w-11 p-0" onClick={() => go(-1)} aria-label="Previous">
          &larr;
        </button>
        <button className="btn h-11 w-11 p-0" onClick={() => go(1)} aria-label="Next">
          &rarr;
        </button>
      </div>
      <div
        ref={ref}
        className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 [scrollbar-width:none] md:-mx-6 md:px-6 [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((s) => (
          <Link key={s.href} href={s.href} className="group w-[82%] shrink-0 snap-start sm:w-[46%] lg:w-[31%]">
            <div className={`relative aspect-[4/3.3] overflow-hidden rounded-[2rem] bg-gradient-to-br ${s.tone} p-7`}>
              <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl transition group-hover:scale-125" />
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 text-white backdrop-blur">
                <Icon name={s.icon} className="h-6 w-6" />
              </span>
              <p className="display absolute bottom-7 left-7 right-7 text-4xl text-white">{s.stat}</p>
            </div>
            <h3 className="display mt-5 text-2xl">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
            <span className="mt-3 inline-block text-sm font-semibold text-brand-2 transition group-hover:translate-x-1">
              Explore &rarr;
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
