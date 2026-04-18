import type { Currency } from "./types";

function apiCode(c: Currency): string {
  return c === "NIS" ? "ILS" : c;
}

export interface MarketRate {
  rate: number;
  date: string;
}

/** Fetch received-per-paid rate. Uses Frankfurter (ECB data). */
export async function fetchMarketRate(
  paid: Currency,
  received: Currency,
  isoDate: string,
): Promise<MarketRate> {
  if (paid === received) return { rate: 1, date: isoDate.slice(0, 10) };
  const date = isoDate.slice(0, 10);
  const url = `https://api.frankfurter.dev/v1/${date}?base=${apiCode(paid)}&symbols=${apiCode(received)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Market rate lookup failed (${res.status})`);
  const data = await res.json();
  const rate = data?.rates?.[apiCode(received)];
  if (typeof rate !== "number") {
    throw new Error("Market rate not available for that date/pair");
  }
  return { rate, date: data.date ?? date };
}
