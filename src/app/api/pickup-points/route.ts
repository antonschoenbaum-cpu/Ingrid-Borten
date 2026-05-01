import { NextRequest, NextResponse } from "next/server";

/** Shipmondo v3 pickup_points: én `carrier_code` pr. kald (jf. API / PHP-SDK). */
const PICKUP_CARRIER_CODES = ["gls", "dao", "pdk"] as const;

const MAX_POINTS = 8;

type ShipmondoPickupRow = Record<string, unknown>;

function parseDistanceMeters(p: ShipmondoPickupRow): number | null {
  const d = p.distance;
  if (d == null) return null;
  const n = Number(d);
  return Number.isFinite(n) ? n : null;
}

type MappedPoint = {
  id: string;
  name: string;
  address: string;
  city: string;
  zipcode: string;
  carrier: string;
  opening_hours: unknown[];
  distance: number | null;
};

function mapPickupPoint(p: ShipmondoPickupRow): MappedPoint {
  const opening = p.opening_hours;
  return {
    id: String(p.id ?? ""),
    name: String(p.name || p.company_name || "Pakkeshop"),
    address: String(p.address ?? ""),
    city: String(p.city ?? ""),
    zipcode: String(p.zipcode ?? ""),
    carrier: String(p.carrier_code ?? ""),
    opening_hours: Array.isArray(opening) ? opening : [],
    distance: parseDistanceMeters(p),
  };
}

function sortPickupPoints(a: MappedPoint, b: MappedPoint): number {
  const da = a.distance;
  const db = b.distance;
  const aHas = da != null;
  const bHas = db != null;
  if (aHas && bHas) return da! - db!;
  if (aHas) return -1;
  if (bHas) return 1;
  return a.name.localeCompare(b.name, "da");
}

export async function GET(req: NextRequest) {
  const zipcode = (req.nextUrl.searchParams.get("zipcode") ?? "").trim();
  const address = (req.nextUrl.searchParams.get("address") ?? "").trim();

  if (!/^\d{4}$/.test(zipcode)) {
    return NextResponse.json({ error: "Postnummer skal være 4 cifre." }, { status: 400 });
  }
  if (address.length < 2) {
    return NextResponse.json({ error: "Angiv vejnavn og nummer." }, { status: 400 });
  }

  const user = (process.env.SHIPMONDO_API_USER ?? "").trim();
  const key = (process.env.SHIPMONDO_API_KEY ?? "").trim();
  if (!user || !key) {
    return NextResponse.json({ error: "Shipmondo credentials mangler." }, { status: 500 });
  }

  const auth = Buffer.from(`${user}:${key}`).toString("base64");
  const merged: ShipmondoPickupRow[] = [];
  const errors: string[] = [];

  for (const carrierCode of PICKUP_CARRIER_CODES) {
    const url = new URL("https://app.shipmondo.com/api/public/v3/pickup_points");
    url.searchParams.append("zipcode", zipcode);
    url.searchParams.append("country_code", "DK");
    url.searchParams.append("carrier_code", carrierCode);

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      errors.push(`${carrierCode}: ${res.status} ${err}`);
      continue;
    }

    const data: unknown = await res.json().catch(() => null);
    const rows = Array.isArray(data) ? (data as ShipmondoPickupRow[]) : [];
    merged.push(...rows);
  }

  if (merged.length === 0 && errors.length > 0) {
    return NextResponse.json(
      { error: `Kunne ikke hente pakkeshops: ${errors.join(" | ")}`, points: [] },
      { status: 502 },
    );
  }

  const seen = new Set<string>();
  const unique = merged
    .map(mapPickupPoint)
    .filter((p) => {
      if (!p.id || seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

  unique.sort(sortPickupPoints);
  const points = unique.slice(0, MAX_POINTS);

  return NextResponse.json({ points });
}
