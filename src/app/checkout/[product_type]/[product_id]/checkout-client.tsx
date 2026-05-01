"use client";

import { useCallback, useState } from "react";

type PickupPoint = {
  id: string;
  name: string;
  address: string;
  zipcode: string;
  city: string;
  carrier: string;
  distance: number | null;
};

type Props = {
  productType: "paintings" | "jewelry";
  productId: string;
};

function carrierBadge(carrier: string): string {
  const c = carrier.toLowerCase();
  if (c === "gls") return "GLS";
  if (c === "dao") return "DAO";
  if (c === "pdk") return "PostNord";
  return carrier ? carrier.toUpperCase() : "—";
}

function formatDistance(meters: number | null): string | null {
  if (meters == null || !Number.isFinite(meters)) return null;
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

export function CheckoutClient({ productType, productId }: Props) {
  const [streetLine, setStreetLine] = useState("");
  const [zip, setZip] = useState("");
  const [city, setCity] = useState("");
  const [points, setPoints] = useState<PickupPoint[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [pending, setPending] = useState(false);
  const [cityLookupPending, setCityLookupPending] = useState(false);
  const [payPending, setPayPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = points.find((p) => p.id === selectedId) ?? null;

  const tryAutofillCity = useCallback(async (postal: string) => {
    if (!/^\d{4}$/.test(postal)) return;
    setCityLookupPending(true);
    try {
      const res = await fetch(`https://api.dataforsyningen.dk/postnumre/${encodeURIComponent(postal)}?format=json`);
      if (!res.ok) return;
      const data = (await res.json().catch(() => null)) as { navn?: string } | null;
      if (data && typeof data.navn === "string" && data.navn.trim()) {
        setCity(data.navn.trim());
      }
    } catch {
      // Valgfrit — ignoreres.
    } finally {
      setCityLookupPending(false);
    }
  }, []);

  async function loadPoints(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    setPoints([]);
    setSelectedId("");
    const zipTrim = zip.replace(/\D/g, "").slice(0, 4);
    const streetTrim = streetLine.trim();
    if (!/^\d{4}$/.test(zipTrim)) {
      setError("Postnummer skal være 4 cifre.");
      setPending(false);
      return;
    }
    if (streetTrim.length < 2) {
      setError("Angiv vejnavn og nummer.");
      setPending(false);
      return;
    }
    try {
      const qs = new URLSearchParams({
        zipcode: zipTrim,
        address: streetTrim,
      });
      const res = await fetch(`/api/pickup-points?${qs.toString()}`);
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        points?: PickupPoint[];
      };
      if (!res.ok) {
        setError(data.error ?? "Kunne ikke hente pakkeshops.");
        return;
      }
      setPoints(Array.isArray(data.points) ? data.points : []);
    } catch {
      setError("Kunne ikke hente pakkeshops.");
    } finally {
      setPending(false);
    }
  }

  async function startPayment() {
    if (!selected) return;
    const zipTrim = zip.replace(/\D/g, "").slice(0, 4);
    const streetTrim = streetLine.trim();
    const cityTrim = city.trim();
    if (!/^\d{4}$/.test(zipTrim) || streetTrim.length < 2 || cityTrim.length < 1) {
      setError("Udfyld fuld leveringsadresse (vej, postnummer og by).");
      return;
    }
    setError(null);
    setPayPending(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_type: productType,
          product_id: productId,
          pickup_point_id: selected.id,
          pickup_point_name: selected.name,
          pickup_point_address: `${selected.address}, ${selected.zipcode} ${selected.city}`,
          carrier: selected.carrier,
          customer_address: streetTrim,
          customer_zip: zipTrim,
          customer_city: cityTrim,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; url?: string | null };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Kunne ikke starte betaling.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Kunne ikke starte betaling.");
    } finally {
      setPayPending(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded border border-secondary/50 bg-paper-warm/40 p-6">
        <h2 className="font-serif text-xl text-ink">1. Indtast din leveringsadresse</h2>
        <form onSubmit={loadPoints} className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block text-sm text-ink-muted md:col-span-2">
            Vejnavn og nummer
            <input
              value={streetLine}
              onChange={(e) => setStreetLine(e.target.value)}
              className="mt-1 w-full border border-secondary/60 bg-paper px-3 py-2 text-sm text-ink"
              placeholder="Østerbrogade 52"
              required
            />
          </label>
          <label className="block text-sm text-ink-muted">
            Postnummer
            <input
              value={zip}
              onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 4))}
              onBlur={() => void tryAutofillCity(zip.replace(/\D/g, "").slice(0, 4))}
              inputMode="numeric"
              className="mt-1 w-full border border-secondary/60 bg-paper px-3 py-2 text-sm text-ink"
              placeholder="2100"
              maxLength={4}
              required
            />
            {cityLookupPending ? (
              <span className="mt-1 block text-xs text-ink-muted">Slår by op…</span>
            ) : null}
          </label>
          <label className="block text-sm text-ink-muted">
            By
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-1 w-full border border-secondary/60 bg-paper px-3 py-2 text-sm text-ink"
              placeholder="København Ø"
              required
            />
          </label>
          <div className="md:col-span-2">
            <button type="submit" className="btn-outline" disabled={pending}>
              {pending ? "Henter..." : "Find nærmeste pakkeshops"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded border border-secondary/50 bg-paper-warm/40 p-6">
        <h2 className="font-serif text-xl text-ink">2. Vælg pakkeshop</h2>
        {points.length === 0 ? (
          <p className="mt-4 text-sm text-ink-muted">
            Ingen pakkeshops endnu. Udfyld adresse ovenfor og søg.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {points.map((p) => {
              const distLabel = formatDistance(p.distance);
              return (
                <li key={p.id}>
                  <label className="flex cursor-pointer items-start gap-3 rounded border border-secondary/50 bg-paper p-4">
                    <input
                      type="radio"
                      name="pickup"
                      checked={selectedId === p.id}
                      onChange={() => setSelectedId(p.id)}
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-ink">{p.name}</p>
                        <span className="rounded border border-secondary/70 bg-paper-warm px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-ink">
                          {carrierBadge(p.carrier)}
                        </span>
                        {distLabel ? (
                          <span className="text-xs text-ink-muted">{distLabel} fra dig</span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-ink-muted">
                        {p.address}, {p.zipcode} {p.city}
                      </p>
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded border border-secondary/50 bg-paper-warm/40 p-6">
        <h2 className="font-serif text-xl text-ink">3. Fortsæt til betaling</h2>
        <button
          type="button"
          onClick={() => void startPayment()}
          disabled={!selected || payPending}
          className="btn-outline-dark mt-4 disabled:opacity-60"
        >
          {payPending ? "Sender videre..." : "Fortsæt til betaling"}
        </button>
      </section>

      {error ? <p className="text-sm text-rose-dust">{error}</p> : null}
    </div>
  );
}
