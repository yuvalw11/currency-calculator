import type { Currency, Session } from "./types";
import { CURRENCIES } from "./types";

const KEY = "wise-conversion-sessions";

function asCurrency(v: unknown, fallback: Currency): Currency {
  return CURRENCIES.includes(v as Currency) ? (v as Currency) : fallback;
}

export function loadSessions(): Session[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown[];
    if (!Array.isArray(arr)) return [];
    return arr.map((v) => {
      const s = v as Record<string, unknown>;
      const dps = (s.dataPoints as Record<string, unknown>[] | undefined) ?? [];
      const firstPaid = dps[0]?.paidCurrency as Currency | undefined;
      const firstRecv = dps[0]?.receivedCurrency as Currency | undefined;
      return {
        id: String(s.id ?? Math.random()),
        createdAt: String(s.createdAt ?? new Date().toISOString()),
        paidCurrency: asCurrency(s.paidCurrency ?? firstPaid, "USD"),
        receivedCurrency: asCurrency(s.receivedCurrency ?? firstRecv, "EUR"),
        marketRate:
          typeof s.marketRate === "number" ? s.marketRate : undefined,
        marketRateDate:
          typeof s.marketRateDate === "string" ? s.marketRateDate : undefined,
        marketRateSource:
          s.marketRateSource === "manual" || s.marketRateSource === "auto"
            ? s.marketRateSource
            : undefined,
        dataPoints: dps.map((dp) => ({
          id: String(dp.id),
          paidAmount: Number(dp.paidAmount),
          receivedAmount: Number(dp.receivedAmount),
          fees: Number(dp.fees),
          createdAt: String(dp.createdAt ?? new Date().toISOString()),
        })),
      };
    });
  } catch {
    return [];
  }
}

export function saveSessions(sessions: Session[]): void {
  localStorage.setItem(KEY, JSON.stringify(sessions));
}

export function newId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
