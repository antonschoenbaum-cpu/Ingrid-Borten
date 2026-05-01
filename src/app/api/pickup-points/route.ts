import { NextRequest, NextResponse } from "next/server";

/** Shipmondo v3 pickup_points: én `carrier_code` pr. kald (jf. API / PHP-SDK). */
const PICKUP_CARRIER_CODES = ["gls", "dao", "pdk"] as const;

type ShipmondoPickupRow = Record<string, unknown>;

function mapPickupPoint(p: ShipmondoPickupRow) {
  const opening = p.opening_hours;
  return {
    id: String(p.id ?? ""),
    name: String(p.name || p.company_name || "Pakkeshop"),
    address: String(p.address ?? ""),
    city: String(p.city ?? ""),
    zipcode: String(p.zipcode ?? ""),
    carrier: String(p.carrier_code ?? ""),
    opening_hours: Array.isArray(opening) ? opening : [],
  };
}

export async function GET(req: NextRequest) {
  const zipcode = (req.nextUrl.searchParams.get("zipcode") ?? "").trim();
  if (!/^\d{4}$/.test(zipcode)) {
    return NextResponse.json({ error: "Postnummer skal være 4 cifre." }, { status: 400 });
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
  const points = merged
    .map(mapPickupPoint)
    .filter((p) => {
      if (!p.id || seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

  return NextResponse.json({ points });
}
