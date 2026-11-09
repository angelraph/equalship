"use client";

import { useQuery } from "@tanstack/react-query";
import type { Quote } from "./market";

export function useMarket() {
  return useQuery({
    queryKey: ["market"],
    queryFn: async () => (await (await fetch("/api/market")).json()) as Quote[],
    refetchInterval: 20_000,
    staleTime: 10_000,
  });
}

export function useQuote(symbol: string) {
  return useQuery({
    queryKey: ["market", symbol],
    queryFn: async () => {
      const res = await fetch(`/api/market?symbol=${encodeURIComponent(symbol)}`);
      if (!res.ok) throw new Error("No data for this asset");
      return (await res.json()) as Quote;
    },
    refetchInterval: 15_000,
    staleTime: 8_000,
  });
}

export function money(n: number | null | undefined, digits?: number): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "...";
  const d = digits ?? (n >= 1 ? 2 : n >= 0.01 ? 4 : 6);
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d })}`;
}

export function pct(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "...";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

export function compact(n: number | null | undefined): string {
  if (!n) return "...";
  return n.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 1 });
}
