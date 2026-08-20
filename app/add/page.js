"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { STATUS_META } from "../../lib/ui";

const REPORTABLE = ["clean", "ok", "dirty", "out_of_order"];

// Crowdsourced "add a microwave" screen
export default function AddPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    building: "",
    floor: "",
    directions: "",
    status: "clean",
  });
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  async function submit(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/microwaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ...(coords || {}) }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Something went wrong");
      }
      const d = await res.json();
      router.push(`/m/${d.microwave.id}`);
    } catch (err) {
      setError(err.message || "Couldn't add the microwave. Try again.");
      setSubmitting(false);
    }
  }

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
          <h2>Add a microwave</h2>
          <div className="detail-sub">
            Found one we don't have? Put it on the map for every Bobcat. 🐾
          </div>
        </div>

        <form className="report-card" onSubmit={submit}>
          <div className="form-field" style={{ marginTop: 0 }}>
            <label>Name it *</label>
            <input
              required
              maxLength={80}
              placeholder="e.g. Alkek 3rd Floor Study Area Microwave"
              value={form.name}
              onChange={set("name")}
            />
          </div>

          <div className="form-field">
            <label>Building *</label>
            <input
              required
              maxLength={80}
              placeholder="e.g. Alkek Library"
              value={form.building}
              onChange={set("building")}
            />
          </div>

          <div className="form-field">
            <label>Floor</label>
            <input
              maxLength={40}
              placeholder="e.g. 3rd Floor"
              value={form.floor}
              onChange={set("floor")}
            />
          </div>

          <div className="form-field">
            <label>How do you find it?</label>
            <textarea
              rows={2}
              maxLength={280}
              placeholder="e.g. Past the elevators, in the vending machine alcove on the left"
              value={form.directions}
              onChange={set("directions")}
            />
          </div>

          <div className="form-field">
            <label>Current condition</label>
            <div className="status-grid">
              {REPORTABLE.map((s) => {
                const m = STATUS_META[s];
                return (
                  <button
                    type="button"
                    key={s}
                    className={`status-btn ${form.status === s ? "selected" : ""}`}
                    onClick={() => setForm({ ...form, status: s })}
                  >
                    <span className="emoji">{m.emoji}</span>
                    <span className="label" style={{ color: m.color }}>
                      {m.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-field">
            <label>Map pin</label>
            <button
              type="button"
              className="filter-chip"
              style={{ width: "100%", padding: "12px", fontSize: 14 }}
              onClick={useMyLocation}
            >
              {locating
                ? "Getting your location…"
                : coords
                ? `📍 Pinned at your current location ✓`
                : "📍 Use my current location (stand near the microwave)"}
            </button>
            <div className="form-hint">
              Optional — if you skip this, we'll pin it near the Quad and fix it
              later.
            </div>
          </div>

          <button className="submit-btn" disabled={submitting} type="submit">
            {submitting ? "Adding…" : "Add microwave"}
          </button>
          {error && <div className="error-banner">{error}</div>}
        </form>
      </main>
    </>
  );
}
