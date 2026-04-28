"use client";

import { useState } from "react";

type PickupPoint = {
  id: string;
  name: string;
  address: string;
  zipcode: string;
  city: string;
  carrier: string;
};

type Props = {
  productType: "paintings" | "jewelry";
  productId: string;
};

export function CheckoutClient({ productType, productId }: Props) {
  const [zipcode, setZipcode] = useState("");
  const [points, setPoints] = useState<PickupPoint[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [pending, setPending] = useState(false);
  const [payPending, setPayPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = points.find((p) => p.id === selectedId) ?? null;

  async function loadPoints(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    setPoints([]);
    setSelectedId("");
    try {
      const res = await fetch(`/api/pickup-points?zipcode=${encodeURIComponent(zipcode)}`);
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
          carrier: selected.carrier,
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
        <h2 className="font-serif text-xl text-ink">1. Indtast postnummer</h2>
        <form onSubmit={loadPoints} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block flex-1 text-sm text-ink-muted">
            Postnummer
            <input
              value={zipcode}
              onChange={(e) => setZipcode(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="mt-1 w-full border border-secondary/60 bg-paper px-3 py-2 text-sm text-ink"
              placeholder="4000"
              required
            />
          </label>
          <button type="submit" className="btn-outline" disabled={pending}>
            {pending ? "Henter..." : "Find pakkeshops"}
          </button>
        </form>
      </section>

      <section className="rounded border border-secondary/50 bg-paper-warm/40 p-6">
        <h2 className="font-serif text-xl text-ink">2. Vælg pakkeshop</h2>
        {points.length === 0 ? (
          <p className="mt-4 text-sm text-ink-muted">Ingen pakkeshops endnu. Søg med postnummer ovenfor.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {points.map((p) => (
              <li key={p.id}>
                <label className="flex cursor-pointer items-start gap-3 rounded border border-secondary/50 bg-paper p-4">
                  <input
                    type="radio"
                    name="pickup"
                    checked={selectedId === p.id}
                    onChange={() => setSelectedId(p.id)}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-ink">{p.name}</p>
                    <p className="text-sm text-ink-muted">
                      {p.address}, {p.zipcode} {p.city}
                    </p>
                    <p className="text-xs uppercase tracking-wider text-ink-muted">{p.carrier}</p>
                  </div>
                </label>
              </li>
            ))}
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

