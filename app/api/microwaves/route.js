import { NextResponse } from "next/server";
import { readDb, writeDb, withLatest, slugify, STATUSES } from "../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = readDb();
  const list = db.microwaves
    .map(withLatest)
    .sort((a, b) => new Date(b.latestAt || 0) - new Date(a.latestAt || 0));
  return NextResponse.json({ microwaves: list });
}

// Add a new microwave (crowdsourced discovery)
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = String(body.name || "").trim().slice(0, 80);
  const building = String(body.building || "").trim().slice(0, 80);
  const floor = String(body.floor || "").trim().slice(0, 40);
  const directions = String(body.directions || "").trim().slice(0, 280);
  const status = STATUSES.includes(body.status) ? body.status : "unknown";
  const lat = Number(body.lat);
  const lng = Number(body.lng);

  if (!name || !building) {
    return NextResponse.json(
      { error: "Name and building are required" },
      { status: 400 }
    );
  }

  const db = readDb();
  let id = slugify(`${building}-${name}`);
  if (db.microwaves.some((m) => m.id === id)) {
    id = `${id}-${Date.now().toString(36)}`;
  }

  const microwave = {
    id,
    name,
    building,
    floor,
    directions,
    // default to campus center (the Quad) if no pin was set
    lat: Number.isFinite(lat) ? lat : 29.8889,
    lng: Number.isFinite(lng) ? lng : -97.9425,
    createdAt: new Date().toISOString(),
    reports: [
      {
        status,
        note: "First report — microwave added",
        at: new Date().toISOString(),
      },
    ],
  };

  db.microwaves.push(microwave);
  writeDb(db);

  return NextResponse.json({ microwave: withLatest(microwave) }, { status: 201 });
}
