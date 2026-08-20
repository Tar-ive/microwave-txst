import fs from "fs";
import path from "path";

// Simple JSON-file database.
// - Locally: reads/writes data/microwaves.json directly.
// - On Vercel: the deployment filesystem is read-only, so writes fall back to
//   /tmp (persists per warm serverless instance). Reads prefer the /tmp copy
//   when it exists so updates show up immediately.
const SEED_PATH = path.join(process.cwd(), "data", "microwaves.json");
const TMP_PATH = path.join("/tmp", "microwave-txst-db.json");

export const STATUSES = ["clean", "ok", "dirty", "out_of_order", "unknown"];

export function readDb() {
  try {
    if (fs.existsSync(TMP_PATH)) {
      return JSON.parse(fs.readFileSync(TMP_PATH, "utf8"));
    }
  } catch {
    // fall through to seed
  }
  return JSON.parse(fs.readFileSync(SEED_PATH, "utf8"));
}

export function writeDb(db) {
  const json = JSON.stringify(db, null, 2);
  try {
    fs.writeFileSync(SEED_PATH, json);
    // keep tmp copy in sync if it exists, so reads stay consistent
    if (fs.existsSync(TMP_PATH)) fs.writeFileSync(TMP_PATH, json);
  } catch {
    // read-only filesystem (Vercel) — write to /tmp instead
    fs.writeFileSync(TMP_PATH, json);
  }
}

export function latestReport(mw) {
  if (!mw.reports || mw.reports.length === 0) return null;
  return mw.reports.reduce((a, b) => (new Date(a.at) > new Date(b.at) ? a : b));
}

export function withLatest(mw) {
  const latest = latestReport(mw);
  return {
    ...mw,
    latestStatus: latest ? latest.status : "unknown",
    latestNote: latest ? latest.note : "",
    latestAt: latest ? latest.at : null,
    reportCount: mw.reports ? mw.reports.length : 0,
  };
}

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
