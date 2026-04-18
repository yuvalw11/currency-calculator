import { useState } from "react";
import type { Currency, Session } from "./types";
import { CURRENCIES, sessionDateKey, symbol } from "./types";
import { fetchMarketRate } from "./market";
import { newId } from "./storage";

interface Props {
  onCreate: (s: Session) => void;
  onCancel: () => void;
}

export function NewSessionForm({ onCreate, onCancel }: Props) {
  const [paid, setPaid] = useState<Currency>("USD");
  const [received, setReceived] = useState<Currency>("EUR");
  const [rateInput, setRateInput] = useState("");
  const [rateDate, setRateDate] = useState<string | null>(null);
  const [source, setSource] = useState<"manual" | "auto" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = sessionDateKey(new Date().toISOString());
  const dateMismatch =
    source === "auto" && rateDate !== null && rateDate !== today;

  async function autoFetch() {
    if (paid === received) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetchMarketRate(paid, received, new Date().toISOString());
      setRateInput(String(r.rate));
      setRateDate(r.date);
      setSource("auto");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  function onManualRate(v: string) {
    setRateInput(v);
    if (v.trim()) {
      setSource("manual");
      setRateDate(today);
      setError(null);
    } else {
      setSource(null);
      setRateDate(null);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (paid === received) return;
    const rate = parseFloat(rateInput);
    const hasRate = isFinite(rate) && rate > 0;
    onCreate({
      id: newId(),
      createdAt: new Date().toISOString(),
      paidCurrency: paid,
      receivedCurrency: received,
      marketRate: hasRate ? rate : undefined,
      marketRateDate: hasRate ? (rateDate ?? today) : undefined,
      marketRateSource: hasRate ? (source ?? "manual") : undefined,
      dataPoints: [],
    });
  }

  return (
    <form className="new-session" onSubmit={submit}>
      <h2>New session</h2>

      <div className="row">
        <label>
          Paid currency
          <select
            value={paid}
            onChange={(e) => setPaid(e.target.value as Currency)}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {symbol(c)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Received currency
          <select
            value={received}
            onChange={(e) => setReceived(e.target.value as Currency)}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {symbol(c)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        Market rate ({symbol(paid)}1 = {symbol(received)}?)
        <div className="rate-input">
          <input
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            value={rateInput}
            onChange={(e) => onManualRate(e.target.value)}
            placeholder="enter manually or fetch"
          />
          <button
            type="button"
            className="secondary"
            onClick={autoFetch}
            disabled={loading || paid === received}
          >
            {loading ? "fetching…" : "Fetch live"}
          </button>
        </div>
      </label>

      <div className="market-preview">
        {paid === received && (
          <span className="muted">Pick two different currencies.</span>
        )}
        {error && <span className="err">Could not fetch: {error}</span>}
        {source && rateDate && !error && (
          <span className="muted">
            Source: <strong>{source}</strong> · rate date:{" "}
            <strong>{rateDate}</strong>
            {dateMismatch && (
              <span className="warn">
                {" "}
                ⚠ doesn't match today ({today}) — most recent ECB fixing was{" "}
                {rateDate}.
              </span>
            )}
          </span>
        )}
      </div>

      <div className="actions">
        <button type="button" className="secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" disabled={paid === received}>
          Create session
        </button>
      </div>
    </form>
  );
}
