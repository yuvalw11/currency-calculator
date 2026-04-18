import { useEffect, useMemo, useState } from "react";
import "./App.css";
import type { DataPoint, Session } from "./types";
import { formatDateTime, symbol } from "./types";
import { loadSessions, saveSessions } from "./storage";
import { SessionView } from "./SessionView";
import { NewSessionForm } from "./NewSessionForm";

export default function App() {
  const [sessions, setSessions] = useState<Session[]>(() => loadSessions());
  const [activeId, setActiveId] = useState<string | null>(
    () => sessions[0]?.id ?? null,
  );
  const [creating, setCreating] = useState(sessions.length === 0);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  const active = useMemo(
    () => sessions.find((s) => s.id === activeId) ?? null,
    [sessions, activeId],
  );

  function addSession(s: Session) {
    setSessions((prev) => [s, ...prev]);
    setActiveId(s.id);
    setCreating(false);
  }

  function deleteSession(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    setActiveId((curr) => {
      if (curr !== id) return curr;
      const remaining = sessions.filter((s) => s.id !== id);
      return remaining[0]?.id ?? null;
    });
  }

  function updateActive(updater: (s: Session) => Session) {
    if (!activeId) return;
    setSessions((prev) =>
      prev.map((s) => (s.id === activeId ? updater(s) : s)),
    );
  }

  return (
    <div className="app" data-nav={navOpen ? "open" : "closed"}>
      <div className="mobile-topbar">
        <button
          className="nav-toggle"
          onClick={() => setNavOpen((o) => !o)}
          aria-label="Toggle sessions"
        >
          ☰
        </button>
        <h1>Wise</h1>
      </div>
      {navOpen && (
        <div className="nav-backdrop" onClick={() => setNavOpen(false)} />
      )}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Wise</h1>
          <button
            onClick={() => {
              setCreating(true);
              setNavOpen(false);
            }}
          >
            + New
          </button>
        </div>
        {sessions.length === 0 ? (
          <p className="muted small" style={{ padding: "0 16px" }}>
            Create a session to get started.
          </p>
        ) : (
          <ul className="session-list">
            {sessions.map((s) => (
              <li
                key={s.id}
                className={s.id === activeId && !creating ? "active" : ""}
                onClick={() => {
                  setActiveId(s.id);
                  setCreating(false);
                  setNavOpen(false);
                }}
              >
                <div className="session-title">
                  {formatDateTime(s.createdAt)}
                </div>
                <div className="muted small">
                  {symbol(s.paidCurrency)} → {symbol(s.receivedCurrency)} ·{" "}
                  {s.dataPoints.length} pt
                  {s.dataPoints.length === 1 ? "" : "s"}
                </div>
                <button
                  className="link-btn small"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(s.id);
                  }}
                >
                  delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <main className="main">
        {creating ? (
          <NewSessionForm
            onCreate={addSession}
            onCancel={() => setCreating(false)}
          />
        ) : active ? (
          <SessionView
            session={active}
            onAddDataPoint={(dp: DataPoint) =>
              updateActive((s) => ({
                ...s,
                dataPoints: [dp, ...s.dataPoints],
              }))
            }
            onRemoveDataPoint={(id) =>
              updateActive((s) => ({
                ...s,
                dataPoints: s.dataPoints.filter((dp) => dp.id !== id),
              }))
            }
            onUpdateMarket={(rate, date, source) =>
              updateActive((s) => ({
                ...s,
                marketRate: rate,
                marketRateDate: date,
                marketRateSource: source,
              }))
            }
          />
        ) : (
          <div className="empty">
            <p>No session selected.</p>
            <button onClick={() => setCreating(true)}>
              Create your first session
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
