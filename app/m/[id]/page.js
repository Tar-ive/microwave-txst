"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { statusMeta, timeAgo, dateLabel, STATUS_META } from "../../../lib/ui";

const REPORTABLE = ["clean", "ok", "dirty", "out_of_order"];

// Microwave detail + status report screen
export default function MicrowavePage({ params }) {
  const { id } = use(params);
  const [mw, setMw] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [editingDir, setEditingDir] = useState(false);
  const [dirDraft, setDirDraft] = useState("");
  const [savingDir, setSavingDir] = useState(false);
  const [dirError, setDirError] = useState("");

  useEffect(() => {
    fetch("/api/microwaves")
      .then((r) => r.json())
      .then((d) => {
        const found = d.microwaves.find((m) => m.id === id);
        if (found) setMw(found);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true));
  }, [id]);

  async function submit() {
    if (!selected || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/microwaves/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: selected, note }),
      });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setMw(d.microwave);
      setDone(true);
      setSelected(null);
      setNote("");
      setTimeout(() => setDone(false), 4000);
    } catch {
      setError("Couldn't submit your report. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function saveDirections() {
    const trimmed = dirDraft.trim();
    if (!trimmed || savingDir) return;
    setSavingDir(true);
    setDirError("");
    try {
      const res = await fetch("/api/microwaves/directions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, directions: trimmed }),
      });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setMw(d.microwave);
      setEditingDir(false);
    } catch {
      setDirError("Couldn't save. Try again.");
    } finally {
      setSavingDir(false);
    }
  }

  if (notFound) {
    return (
      <main className="container">
        <Link href="/" className="back-link">← Back to all microwaves</Link>
        <div className="empty-state">
          That microwave isn't in our list (yet).{" "}
          <Link href="/add" style={{ textDecoration: "underline", fontWeight: 700 }}>
            Add it?
          </Link>
        </div>
      </main>
    );
  }

  if (!mw) {
    return (
      <main className="container">
        <div className="skeleton" style={{ marginTop: 20 }} />
        <div className="skeleton" style={{ marginTop: 10, height: 200 }} />
      </main>
    );
  }

  const meta = statusMeta(mw.latestStatus);
  const sortedReports = [...(mw.reports || [])].sort(
    (a, b) => new Date(b.at) - new Date(a.at)
  );

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <div className="brand">
            <span className="brand-icon">♨️</span>
            <h1>Microwave @ TXST</h1>
          </div>
        </div>
      </header>

      <main className="container">
        <Link href="/" className="back-link">← All microwaves</Link>

        <div className="detail-head">
          <h2>{mw.name}</h2>
          <div className="detail-sub">
            {mw.building}
            {mw.floor ? ` · ${mw.floor}` : ""}
          </div>
        </div>

        <div className="big-status">
          <span className="emoji">{meta.emoji}</span>
          <div>
            <div className="label" style={{ color: meta.color }}>
              {meta.label}
            </div>
            <div className="when">
              Last reported {timeAgo(mw.latestAt)}
              {mw.latestAt ? ` (${dateLabel(mw.latestAt)})` : ""}
              {mw.latestNote ? ` — “${mw.latestNote}”` : ""}
            </div>
          </div>
        </div>

        <div className="detail-directions">
          <div className="dir-head">
            <strong>How to find it</strong>
            {!editingDir && (
              <button
                className="dir-edit-btn"
                onClick={() => {
                  setDirDraft(mw.directions || "");
                  setDirError("");
                  setEditingDir(true);
                }}
              >
                ✏️ {mw.directions ? "Edit" : "Add"}
              </button>
            )}
          </div>
          {!editingDir &&
            (mw.directions || (
              <span style={{ color: "var(--muted)" }}>
                No directions yet — know where this one hides? Add them!
              </span>
            ))}
          {editingDir && (
            <>
              <textarea
                className="note-input"
                style={{ marginTop: 6 }}
                rows={3}
                maxLength={280}
                autoFocus
                placeholder="e.g. Past the elevators, in the vending machine alcove on the left"
                value={dirDraft}
                onChange={(e) => setDirDraft(e.target.value)}
              />
              <div className="dir-actions">
                <button
                  className="submit-btn dir-save"
                  disabled={!dirDraft.trim() || savingDir}
                  onClick={saveDirections}
                >
                  {savingDir ? "Saving…" : "Save"}
                </button>
                <button
                  className="dir-cancel"
                  onClick={() => setEditingDir(false)}
                >
                  Cancel
                </button>
              </div>
              {dirError && <div className="error-banner">{dirError}</div>}
            </>
          )}
          <div className="dir-note">
            Anyone can improve these directions. The map pin and building are
            fixed.
          </div>
        </div>

        <div className="report-card">
          <h3>Just used it? Report its condition 👇</h3>
          <div className="status-grid">
            {REPORTABLE.map((s) => {
              const m = STATUS_META[s];
              return (
                <button
                  key={s}
                  className={`status-btn ${selected === s ? "selected" : ""}`}
                  onClick={() => setSelected(s)}
                >
                  <span className="emoji">{m.emoji}</span>
                  <span className="label" style={{ color: m.color }}>
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>
          <textarea
            className="note-input"
            rows={2}
            maxLength={200}
            placeholder="Optional note (e.g. 'smells like fish', 'super clean')"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button
            className="submit-btn"
            disabled={!selected || submitting}
            onClick={submit}
          >
            {submitting ? "Submitting…" : "Submit report"}
          </button>
          {done && (
            <div className="success-banner">
              ✅ Thanks! Your report is live for other Bobcats.
            </div>
          )}
          {error && <div className="error-banner">{error}</div>}
        </div>

        <div className="history">
          <h3>Report history</h3>
          {sortedReports.slice(0, 15).map((r, i) => {
            const m = statusMeta(r.status);
            return (
              <div className="history-item" key={i}>
                <span className="h-emoji">{m.emoji}</span>
                <div className="h-body">
                  <span className="h-status" style={{ color: m.color }}>
                    {m.label}
                  </span>
                  {r.note && <span className="h-note"> — “{r.note}”</span>}
                </div>
                <span className="h-time">{dateLabel(r.at)}</span>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
