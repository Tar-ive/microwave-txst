"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { statusMeta, timeAgo, dateLabel } from "../lib/ui";

const CampusMap = dynamic(() => import("../components/CampusMap"), {
  ssr: false,
  loading: () => (
    <div className="map-wrap">
      <div className="map skeleton" style={{ borderRadius: 0 }} />
    </div>
  ),
});

const FILTERS = [
  { key: "all", label: "All" },
  { key: "clean", label: "✨ Clean" },
  { key: "ok", label: "👍 Usable" },
  { key: "dirty", label: "🤢 Dirty" },
  { key: "out_of_order", label: "🚫 Down" },
];

export default function Home() {
  const [microwaves, setMicrowaves] = useState(null);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState(false);
  const [fabHidden, setFabHidden] = useState(false);

  // The big "add one" banner only greets first-time visitors at the top of
  // the page — dismiss it permanently on first scroll (the header button
  // remains as the way to add).
  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 60) {
        setFabHidden(true);
        window.removeEventListener("scroll", onScroll);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/microwaves")
        .then((r) => r.json())
        .then((d) => {
          if (!alive) return;
          setMicrowaves(d.microwaves);
          setStats(d.stats);
        })
        .catch(() => alive && setError(true));
    load();
    // keep the landing page fresh
    const t = setInterval(load, 60000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const filtered = useMemo(() => {
    if (!microwaves) return null;
    if (filter === "all") return microwaves;
    return microwaves.filter((m) => m.latestStatus === filter);
  }, [microwaves, filter]);

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <div className="brand">
            <span className="brand-icon">♨️</span>
            <h1>
              Microwave @ TXST
              <span className="tag">FIND ONE · HEAT UP · REPORT BACK</span>
            </h1>
          </div>
          <Link href="/add" className="header-btn">
            ＋ Add one
          </Link>
        </div>
      </header>

      <main className="container">
        {microwaves && <CampusMap microwaves={microwaves} />}
        {!microwaves && !error && (
          <div className="map-wrap">
            <div className="map skeleton" style={{ borderRadius: 0 }} />
          </div>
        )}
        <p className="map-note">
          Locations are student-reported. Cross-check buildings on the{" "}
          <a
            href="https://maps.txstate.edu"
            target="_blank"
            rel="noopener noreferrer"
          >
            official TXST campus map
          </a>
          .
        </p>

        {stats && microwaves && (
          <div className="stats-strip">
            <div className="stat">
              <strong>{stats.weeklyReports}</strong>
              <span>reports this week</span>
            </div>
            <div className="stat">
              <strong>{microwaves.length}</strong>
              <span>microwaves tracked</span>
            </div>
            <div className="stat">
              <strong>{stats.realWeeklyReports}</strong>
              <span>live this week 🔴</span>
            </div>
          </div>
        )}

        <div className="section-row">
          <h2>Latest reports</h2>
        </div>

        <div className="filters">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`filter-chip ${filter === f.key ? "active" : ""}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="error-banner">
            Couldn't load microwaves. Pull to refresh or try again.
          </div>
        )}

        {!filtered && !error && (
          <div className="card-list">
            <div className="skeleton" />
            <div className="skeleton" />
            <div className="skeleton" />
          </div>
        )}

        {filtered && filtered.length === 0 && (
          <div className="empty-state">
            No microwaves with that status right now. 🎉
          </div>
        )}

        {filtered && (
          <div className="card-list">
            {filtered.map((mw) => {
              const meta = statusMeta(mw.latestStatus);
              return (
                <Link key={mw.id} href={`/m/${mw.id}`} className="mw-card">
                  <div className="mw-card-top">
                    <div>
                      <div className="mw-name">{mw.name}</div>
                      <div className="mw-loc">
                        {mw.building}
                        {mw.floor ? ` · ${mw.floor}` : ""}
                      </div>
                    </div>
                    <span
                      className="status-chip"
                      style={{ color: meta.color, background: meta.bg }}
                    >
                      {meta.emoji} {meta.label}
                    </span>
                  </div>
                  {mw.latestNote && (
                    <div className="mw-note">“{mw.latestNote}”</div>
                  )}
                  <div className="mw-card-bottom">
                    <span className="mw-time">
                      Reported <strong>{timeAgo(mw.latestAt)}</strong>
                      {mw.latestAt ? ` · ${dateLabel(mw.latestAt)}` : ""} ·{" "}
                      {mw.reportCount} report{mw.reportCount !== 1 ? "s" : ""}
                    </span>
                    <span style={{ color: "var(--maroon)", fontWeight: 700, fontSize: 13 }}>
                      Update →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <footer className="footer">
          Built by Bobcats, for Bobcats. Statuses are crowdsourced — after you
          use a microwave, take 5 seconds to report how you left it. 🐾
          <br />
          Not affiliated with Texas State University.
        </footer>
      </main>

      <Link href="/add" className={`fab ${fabHidden ? "fab-hidden" : ""}`}>
        ♨️ Found a microwave we're missing? Add it
      </Link>
    </>
  );
}
