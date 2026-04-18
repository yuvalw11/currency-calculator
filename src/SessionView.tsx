import { useState } from "react";
import type { DataPoint, RateSource, Session } from "./types";
import {
  baseRate,
  effectiveRate,
  feeShareVsBase,
  feeShareVsMarket,
  formatAmount,
  formatDateTime,
  formatPercent,
  formatRate,
  hasDateMismatch,
  marketRateView,
  sessionDateKey,
  symbol,
} from "./types";
import { DataPointForm } from "./DataPointForm";
import { fetchMarketRate } from "./market";

interface Props {
  session: Session;
  onAddDataPoint: (dp: DataPoint) => void;
  onRemoveDataPoint: (id: string) => void;
  onUpdateMarket: (rate: number, date: string, source: RateSource) => void;
}

export function SessionView({
  session,
  onAddDataPoint,
  onRemoveDataPoint,
  onUpdateMarket,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetchErr, setFetchErr] = useState<string | null>(null);
  const market = marketRateView(session);
  const sessionDate = sessionDateKey(session.createdAt);

  async function autoFetch() {
    setFetching(true);
    setFetchErr(null);
    try {
      const r = await fetchMarketRate(
        session.paidCurrency,
        session.receivedCurrency,
        session.createdAt,
      );
      onUpdateMarket(r.rate, r.date, "auto");
    } catch (e) {
      setFetchErr(e instanceof Error ? e.message : String(e));
    } finally {
      setFetching(false);
    }
  }

  function startEdit() {
    setDraft(session.marketRate ? String(session.marketRate) : "");
    setEditing(true);
  }

  function saveEdit() {
    const r = parseFloat(draft);
    if (!isFinite(r) || r <= 0) return;
    onUpdateMarket(r, sessionDate, "manual");
    setEditing(false);
  }

  return (
    <div className="session-view">
      <header className="session-header">
        <h2 className="session-label">{formatDateTime(session.createdAt)}</h2>
      </header>

      <div className="session-meta">
        <div>
          <span className="muted">Pair:</span>{" "}
          <strong>
            {symbol(session.paidCurrency)} → {symbol(session.receivedCurrency)}
          </strong>
        </div>
        <div className="market-row">
          <span className="muted">Market rate:</span>{" "}
          {editing ? (
            <>
              <input
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`${symbol(session.paidCurrency)}1 = ${symbol(session.receivedCurrency)}?`}
                style={{
                  padding: "4px 8px",
                  border: "1px solid #d2d6dc",
                  borderRadius: 4,
                  width: 160,
                }}
              />
              <button type="button" onClick={saveEdit} style={{ marginLeft: 8 }}>
                save
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => setEditing(false)}
                style={{ marginLeft: 4 }}
              >
                cancel
              </button>
            </>
          ) : (
            <>
              {market ? (
                <strong>{formatRate(market)}</strong>
              ) : (
                <span className="muted">not set</span>
              )}
              {session.marketRateDate && (
                <span className="muted">
                  {" "}
                  · {session.marketRateSource ?? "?"} ·{" "}
                  {session.marketRateDate}
                </span>
              )}
              <button
                type="button"
                className="link-btn"
                onClick={startEdit}
                style={{ marginLeft: 8 }}
              >
                edit
              </button>
              <button
                type="button"
                className="link-btn"
                onClick={autoFetch}
                disabled={fetching}
                style={{ marginLeft: 8 }}
              >
                {fetching ? "fetching…" : "fetch live"}
              </button>
              {fetchErr && <span className="err"> {fetchErr}</span>}
            </>
          )}
        </div>
        {hasDateMismatch(session) && (
          <div className="warn">
            ⚠ Market rate is from {session.marketRateDate}, but session date is{" "}
            {sessionDate}. Free APIs only publish daily ECB fixings — enter the
            rate manually for an exact intraday value.
          </div>
        )}
      </div>

      <DataPointForm session={session} onAdd={onAddDataPoint} />

      {session.dataPoints.length === 0 ? (
        <p className="muted">No data points yet.</p>
      ) : (
        <>
          <div className="dp-table-wrap">
            <table className="dp-table">
              <thead>
                <tr>
                  <th>Paid</th>
                  <th>Fees</th>
                  <th>Received</th>
                  <th>Base rate</th>
                  <th>Effective rate</th>
                  <th title="Explicit fees as a fraction of paid (gap between base and effective rates)">
                    Fee share vs base
                  </th>
                  <th title="Total cost vs. mid-market: (paid − received/market) / paid">
                    Fee share vs market
                  </th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {session.dataPoints.map((dp) => (
                  <tr key={dp.id}>
                    <td>{formatAmount(dp.paidAmount, session.paidCurrency)}</td>
                    <td>{formatAmount(dp.fees, session.paidCurrency)}</td>
                    <td>
                      {formatAmount(dp.receivedAmount, session.receivedCurrency)}
                    </td>
                    <td>{formatRate(baseRate(dp, session))}</td>
                    <td>{formatRate(effectiveRate(dp, session))}</td>
                    <td>{formatPercent(feeShareVsBase(dp))}</td>
                    <td>{formatPercent(feeShareVsMarket(dp, session))}</td>
                    <td>
                      <button
                        className="link-btn"
                        onClick={() => onRemoveDataPoint(dp.id)}
                        aria-label="Remove data point"
                      >
                        remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="dp-cards">
            {session.dataPoints.map((dp) => (
              <li key={dp.id} className="dp-card">
                <div className="dp-card-header">
                  <span className="muted small">
                    {formatDateTime(dp.createdAt)}
                  </span>
                  <button
                    className="link-btn"
                    onClick={() => onRemoveDataPoint(dp.id)}
                    aria-label="Remove data point"
                  >
                    remove
                  </button>
                </div>
                <dl className="dp-card-grid">
                  <dt>Paid</dt>
                  <dd>{formatAmount(dp.paidAmount, session.paidCurrency)}</dd>
                  <dt>Fees</dt>
                  <dd>{formatAmount(dp.fees, session.paidCurrency)}</dd>
                  <dt>Received</dt>
                  <dd>
                    {formatAmount(dp.receivedAmount, session.receivedCurrency)}
                  </dd>
                  <dt>Base rate</dt>
                  <dd>{formatRate(baseRate(dp, session))}</dd>
                  <dt>Effective rate</dt>
                  <dd>{formatRate(effectiveRate(dp, session))}</dd>
                  <dt title="Explicit fees as a fraction of paid">
                    Fee share vs base
                  </dt>
                  <dd>{formatPercent(feeShareVsBase(dp))}</dd>
                  <dt title="Total cost vs. mid-market: (paid − received/market) / paid">
                    Fee share vs market
                  </dt>
                  <dd>{formatPercent(feeShareVsMarket(dp, session))}</dd>
                </dl>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
