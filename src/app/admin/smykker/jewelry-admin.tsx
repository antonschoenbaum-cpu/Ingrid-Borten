"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArtworkImage } from "@/components/artwork-image";
import { UploadForm } from "@/components/UploadForm";
import { formatPriceDKK } from "@/lib/format";
import type { Jewelry } from "@/types/content";

type Props = {
  initial: Jewelry[];
};

const empty = { title: "", description: "", price: "", image: "" };

export function JewelryAdmin({ initial }: Props) {
  const router = useRouter();
  const items = initial;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function startEdit(p: Jewelry) {
    setEditingId(p.id);
    setForm({
      title: p.title,
      description: p.description,
      price: String(p.price).replace(".", ","),
      image: p.image,
    });
    setMsg(null);
    setErr(null);
  }

  function startNew() {
    setEditingId("new");
    setForm(empty);
    setMsg(null);
    setErr(null);
  }

  function cancelForm() {
    setEditingId(null);
    setForm(empty);
    setMsg(null);
    setErr(null);
  }

  async function save() {
    setErr(null);
    setMsg(null);
    const priceNum = Number(form.price.replace(/\s/g, "").replace(",", "."));
    const body = {
      title: form.title.trim(),
      description: form.description,
      price: priceNum,
      image: form.image.trim(),
    };
    if (!body.title || !body.image) {
      setErr("Titel og billede-URL er påkrævet (upload først).");
      return;
    }
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setErr("Ugyldig pris.");
      return;
    }

    setPending(true);
    const isNew = editingId === "new";
    const url = isNew ? "/api/jewelry" : `/api/jewelry/${editingId}`;
    const res = await fetch(url, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setPending(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setErr(j.error ?? "Kunne ikke gemme.");
      return;
    }
    setMsg(isNew ? "Smykke oprettet." : "Smykke opdateret.");
    cancelForm();
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Slette dette smykke?")) return;
    setErr(null);
    const res = await fetch(`/api/jewelry/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setErr("Kunne ikke slette.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-serif text-3xl text-ink">Smykker</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Billedfiler gemmes under <code className="text-xs">/public/uploads/jewelry/</code>.
        </p>
      </div>

      <ul className="space-y-6">
        {items.map((p) => (
          <li
            key={p.id}
            className="section-rule flex flex-col gap-4 pt-6 first:border-0 first:pt-0 sm:flex-row sm:items-start"
          >
            <div className="h-28 w-40 shrink-0 overflow-hidden border border-secondary/50 bg-paper-warm">
              <ArtworkImage src={p.image} alt="" className="size-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-serif text-lg text-ink">{p.title}</h2>
              <p className="mt-1 text-accent">{formatPriceDKK(p.price)}</p>
              <p className="mt-2 line-clamp-2 text-sm text-ink-muted">{p.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => startEdit(p)} className="btn-outline text-[11px]">
                  Rediger
                </button>
                <button
                  type="button"
                  onClick={() => remove(p.id)}
                  className="btn-outline border-rose-dust/50 text-rose-dust hover:bg-rose-dust/10"
                >
                  Slet
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="section-rule pt-10">
        {!editingId ? (
          <button type="button" onClick={startNew} className="btn-outline">
            Tilføj nyt smykke
          </button>
        ) : (
          <div className="space-y-6 rounded border border-secondary/50 bg-paper-warm/40 p-6">
            <h2 className="font-serif text-xl text-ink">
              {editingId === "new" ? "Nyt smykke" : "Rediger smykke"}
            </h2>
            <UploadForm
              folder="jewelry"
              label="Upload billede (gemmes under /uploads/jewelry/)"
              onUploaded={(url) => setForm((f) => ({ ...f, image: url }))}
            />
            <label className="block text-sm text-ink-muted">
              Billede-URL
              <input
                value={form.image}
                onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                className="mt-1 w-full border border-secondary/60 bg-paper px-3 py-2 text-sm text-ink"
                placeholder="/uploads/jewelry/… eller ekstern URL"
              />
            </label>
            <label className="block text-sm text-ink-muted">
              Titel
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="mt-1 w-full border border-secondary/60 bg-paper px-3 py-2 text-sm text-ink"
              />
            </label>
            <label className="block text-sm text-ink-muted">
              Beskrivelse
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={4}
                className="mt-1 w-full border border-secondary/60 bg-paper px-3 py-2 text-sm text-ink"
              />
            </label>
            <label className="block text-sm text-ink-muted">
              Pris (kr., tal)
              <input
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                inputMode="decimal"
                className="mt-1 w-full border border-secondary/60 bg-paper px-3 py-2 text-sm text-ink"
                placeholder="890"
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <button type="button" disabled={pending} onClick={save} className="btn-outline">
                Gem
              </button>
              <button type="button" onClick={cancelForm} className="btn-outline-dark">
                Annuller
              </button>
            </div>
          </div>
        )}
      </div>

      {msg ? <p className="text-sm text-accent">{msg}</p> : null}
      {err ? <p className="text-sm text-rose-dust">{err}</p> : null}
    </div>
  );
}
