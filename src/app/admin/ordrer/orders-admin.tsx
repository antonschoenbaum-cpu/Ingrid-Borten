"use client";

import { useEffect, useState } from "react";

type Order = {
  id: string;
  created_at: string;
  product_title: string;
  customer_name: string;
  customer_email: string;
  customer_address: string;
  customer_city: string;
  customer_zip: string;
  amount: number;
  status: string;
  selected_carrier: string | null;
  selected_pickup_point_id: string | null;
  label_url: string | null;
};

export function OrdersAdmin() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Order | null>(null);

  async function load() {
    setError(null);
    const res = await fetch("/api/admin/orders", { cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as { error?: string; orders?: Order[] };
    if (!res.ok) {
      setError(data.error ?? "Kunne ikke hente ordrer.");
      return;
    }
    setOrders(Array.isArray(data.orders) ? data.orders : []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function markShipped(order: Order) {
    const res = await fetch(`/api/admin/orders/${order.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "shipped" }),
    });
    if (!res.ok) {
      setError("Kunne ikke opdatere status.");
      return;
    }
    await load();
  }

  function statusLabel(status: string) {
    if (status === "paid") return "Betalt";
    if (status === "shipped") return "Afsendt";
    return "Afventer";
  }

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-ink">Ordrer</h1>
      <div className="overflow-x-auto rounded border border-secondary/40 bg-paper">
        <table className="min-w-full text-sm">
          <thead className="bg-paper-warm/60 text-left text-ink-muted">
            <tr>
              <th className="px-4 py-3">Dato</th>
              <th className="px-4 py-3">Produkt</th>
              <th className="px-4 py-3">Køber</th>
              <th className="px-4 py-3">Pris</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-secondary/30">
                <td className="px-4 py-3">{new Date(o.created_at).toLocaleDateString("da-DK")}</td>
                <td className="px-4 py-3">{o.product_title}</td>
                <td className="px-4 py-3">{o.customer_name}</td>
                <td className="px-4 py-3">{(o.amount / 100).toLocaleString("da-DK")} kr.</td>
                <td className="px-4 py-3">
                  <span className="rounded border border-secondary/50 px-2 py-1 text-xs">
                    {statusLabel(o.status)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button type="button" className="btn-outline text-[11px]" onClick={() => setSelected(o)}>
                      Detaljer
                    </button>
                    {o.status !== "shipped" ? (
                      <button
                        type="button"
                        className="btn-outline text-[11px]"
                        onClick={() => void markShipped(o)}
                      >
                        Marker som afsendt
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected ? (
        <div className="rounded border border-secondary/50 bg-paper-warm/40 p-5">
          <h2 className="font-serif text-xl text-ink">Ordredetaljer</h2>
          <p className="mt-2 text-sm text-ink-muted">Køber: {selected.customer_name}</p>
          <p className="text-sm text-ink-muted">Email: {selected.customer_email}</p>
          <p className="text-sm text-ink-muted">
            Adresse: {selected.customer_address}, {selected.customer_zip} {selected.customer_city}
          </p>
          <p className="text-sm text-ink-muted">
            Pakkeshop: {selected.selected_pickup_point_id ?? "Ikke angivet"}
          </p>
          {selected.label_url ? (
            <a
              href={selected.label_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex text-sm text-accent underline"
            >
              Åbn fragtlabel
            </a>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="text-sm text-rose-dust">{error}</p> : null}
    </div>
  );
}

