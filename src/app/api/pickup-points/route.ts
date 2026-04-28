import { NextRequest, NextResponse } from "next/server";

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

  const url = new URL("https://app.shipmondo.com/api/public/v3/pickup_points");
  url.searchParams.set("zip_code", zipcode);
  url.searchParams.set("country_code", "DK");
  url.searchParams.set("carriers", "gls,postnord,dao");

  const auth = Buffer.from(`${user}:${key}`).toString("base64");
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
    return NextResponse.json(
      { error: `Kunne ikke hente pakkeshops (${res.status}): ${err}` },
      { status: 502 },
    );
  }

  const data = (await res.json().catch(() => ({}))) as {
    output?: Array<Record<string, unknown>>;
    items?: Array<Record<string, unknown>>;
  };

  const raw = Array.isArray(data.output) ? data.output : Array.isArray(data.items) ? data.items : [];
  const points = raw.map((p) => ({
    id: String(p.id ?? ""),
    name: String(p.name ?? p.company_name ?? "Pakkeshop"),
    address: String(p.address1 ?? p.address ?? ""),
    zipcode: String(p.zip_code ?? p.zipcode ?? ""),
    city: String(p.city ?? ""),
    carrier: String(p.carrier_code ?? p.carrier ?? "").toLowerCase(),
  }));

  return NextResponse.json({ points: points.filter((p) => p.id) });
}

