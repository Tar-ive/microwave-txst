import { NextResponse } from "next/server";
import { readDb, writeDb, withLatest, STATUSES } from "../../../../lib/db";

export const dynamic = "force-dynamic";

// Submit a status report for a microwave
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id, status } = body;
  const note = String(body.note || "").trim().slice(0, 200);

  if (!STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const db = readDb();
  const mw = db.microwaves.find((m) => m.id === id);
  if (!mw) {
    return NextResponse.json({ error: "Microwave not found" }, { status: 404 });
  }

  mw.reports.push({ status, note, at: new Date().toISOString() });
  // keep only the most recent 50 reports per microwave
  if (mw.reports.length > 50) {
    mw.reports = mw.reports
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, 50);
  }
  writeDb(db);

  return NextResponse.json({ microwave: withLatest(mw) });
}
