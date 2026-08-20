import { NextResponse } from "next/server";
import { readDb, writeDb, withLatest } from "../../../../lib/db";

export const dynamic = "force-dynamic";

// Community edit of a microwave's "how to find it" directions.
// The map location (lat/lng, building, floor) is intentionally not editable.
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id } = body;
  const directions = String(body.directions || "").trim().slice(0, 280);

  if (!directions) {
    return NextResponse.json(
      { error: "Directions can't be empty" },
      { status: 400 }
    );
  }

  const db = readDb();
  const mw = db.microwaves.find((m) => m.id === id);
  if (!mw) {
    return NextResponse.json({ error: "Microwave not found" }, { status: 404 });
  }

  mw.directions = directions;
  mw.directionsUpdatedAt = new Date().toISOString();
  writeDb(db);

  return NextResponse.json({ microwave: withLatest(mw) });
}
