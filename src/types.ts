export const CURRENCIES = ["USD", "EUR", "GBP", "NIS"] as const;
export type Currency = (typeof CURRENCIES)[number];

const SYMBOLS: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  NIS: "₪",
};

export function symbol(c: Currency): string {
  return SYMBOLS[c] ?? c;
}

export interface DataPoint {
  id: string;
  paidAmount: number;
  receivedAmount: number;
  fees: number;
  createdAt: string;
}

export type RateSource = "manual" | "auto";

export interface Session {
  id: string;
  createdAt: string;
  paidCurrency: Currency;
  receivedCurrency: Currency;
  marketRate?: number;
  marketRateDate?: string;
  marketRateSource?: RateSource;
  dataPoints: DataPoint[];
}

export function sessionDateKey(iso: string): string {
  return iso.slice(0, 10);
}

/** True if an auto-fetched rate's date differs from the session's date. */
export function hasDateMismatch(session: Session): boolean {
  if (session.marketRateSource !== "auto") return false;
  if (!session.marketRateDate) return false;
  return session.marketRateDate !== sessionDateKey(session.createdAt);
}

export interface RateView {
  value: number;
  from: Currency;
  to: Currency;
}

function orientRate(
  numerator: number,
  denominator: number,
  numCcy: Currency,
  denCcy: Currency,
): RateView | null {
  if (denominator <= 0 || numerator <= 0) return null;
  const r = numerator / denominator;
  if (r >= 1) return { value: r, from: denCcy, to: numCcy };
  return { value: 1 / r, from: numCcy, to: denCcy };
}

export function baseRate(dp: DataPoint, session: Session): RateView | null {
  return orientRate(
    dp.receivedAmount,
    dp.paidAmount - dp.fees,
    session.receivedCurrency,
    session.paidCurrency,
  );
}

export function effectiveRate(
  dp: DataPoint,
  session: Session,
): RateView | null {
  return orientRate(
    dp.receivedAmount,
    dp.paidAmount,
    session.receivedCurrency,
    session.paidCurrency,
  );
}

export function marketRateView(session: Session): RateView | null {
  if (!session.marketRate) return null;
  return orientRate(
    session.marketRate,
    1,
    session.receivedCurrency,
    session.paidCurrency,
  );
}

/**
 * Total fee share vs. the mid-market rate.
 * (paidAmount − receivedAmount/marketRate) / paidAmount — includes explicit fees + FX spread.
 */
export function feeShareVsMarket(
  dp: DataPoint,
  session: Session,
): number | null {
  if (!session.marketRate || session.marketRate <= 0) return null;
  if (dp.paidAmount <= 0) return null;
  const fairPaid = dp.receivedAmount / session.marketRate;
  return (dp.paidAmount - fairPaid) / dp.paidAmount;
}

/** Fee share vs. the base (fee-excluded) rate — just the explicit fees as a fraction of paid. */
export function feeShareVsBase(dp: DataPoint): number | null {
  if (dp.paidAmount <= 0) return null;
  return dp.fees / dp.paidAmount;
}

export function formatRate(r: RateView | null): string {
  if (!r) return "—";
  return `${symbol(r.from)}1 = ${symbol(r.to)}${r.value.toFixed(6)}`;
}

export function formatAmount(amount: number, c: Currency): string {
  return `${symbol(c)}${amount}`;
}

export function formatPercent(p: number | null): string {
  if (p == null || !isFinite(p)) return "—";
  return `${(p * 100).toFixed(3)}%`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString();
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}
