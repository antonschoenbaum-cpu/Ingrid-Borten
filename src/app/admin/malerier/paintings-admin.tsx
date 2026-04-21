/**
 * Supabase reference (kør i SQL editor ved migrering til Supabase):
 * -- ALTER TABLE paintings ADD COLUMN sold boolean DEFAULT false;
 */
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArtworkImage } from "@/components/artwork-image";
import { UploadForm } from "@/components/UploadForm";
import { formatPriceDKK } from "@/lib/format";
import type { Painting } from "@/types/content";

type Props = {
  initial: Painting[];
};

const empty = { title: "", description: "", price: "", image: "", sold: false };

function FormFields({
  form,
  setForm,
}: {
  form: typeof empty;
  setForm: React.Dispatch<React.SetStateAction<typeof empty>>;
}) {
  return (
    <div className="space-y-6">
      <UploadForm
        folder="paintings"
        label="Upload billede (gemmes under /uploads/paintings/)"
        onUploaded={(url) => setForm((f) => ({ ...f, image: url }))}
      />
      <label className="block text-sm text-ink-muted">
        Billede-URL
        <input
          value={form.image}
          onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
          className="mt-1 w-full border border-secondary/60 bg-paper px-3 py-2 text-sm text-ink"
          placeholder="/uploads/paintings/… eller ekstern URL"
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
          placeholder="3200"
        />
      </label>
    </div>
  );
}

export function PaintingsAdmin({ initial }: Props) {
  const router = useRouter();
  const items = initial;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  function startEdit(p: Painting) {
    setEditingId(p.id);
    setForm({
      title: p.title,
      description: p.description,
      price: String(p.price).replace(".", ","),
      image: p.image,
      sold: p.sold === true,
    });
    setMsg(null);
    setErr(null);
  }

  function startNew() {
    if (editingId === "new") {
      cancelForm();
      return;
    }
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

  async function toggleSold(p: Painting, sold: boolean) {
    setErr(null);
    setTogglingId(p.id);
    const res = await fetch(`/api/paintings/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: p.title,
        description: p.description,
        image: p.image,
        price: p.price,
        createdAt: p.createdAt,
        sold,
      }),
    });
    setTogglingId(null);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setErr(j.error ?? "Kunne ikke opdatere solgt-status.");
      return;
    }
    router.refresh();
  }

  async function save() {
    setErr(null);
    setMsg(null);
    const priceNum = Number(form.price.replace(/\s/g, "").replace(",", "."));
    const row = editingId !== "new" ? items.find((i) => i.id === editingId) : null;
    const sold = editingId === "new" ? form.sold === true : row?.sold === true;

    const body = {
      title: form.title.trim(),
      description: form.description,
      price: priceNum,
      image: form.image.trim(),
      sold,
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
    const url = isNew ? "/api/paintings" : `/api/paintings/${editingId}`;
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
    setMsg(isNew ? "Maleri oprettet." : "Maleri opdateret.");
    cancelForm();
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Slette dette maleri?")) return;
    setErr(null);
    const res = await fetch(`/api/paintings/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setErr("Kunne ikke slette.");
      return;
    }
    if (editingId === id) cancelForm();
    router.refresh();
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-serif text-3xl text-ink">Malerier</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Billedfiler gemmes under <code className="text-xs">/public/uploads/paintings/</code>.
        </p>
      </div>

      <button type="button" onClick={startNew} className="btn-outline">
        {editingId === "new" ? "Luk nyt maleri" : "Tilføj nyt maleri"}
      </button>

      {editingId === "new" ? (
        <div className="rounded border border-secondary/50 bg-paper-warm/40 p-6">
          <h2 className="font-serif text-xl text-ink">Nyt maleri</h2>
          <div className="mt-6">
            <FormFields form={form} setForm={setForm} />
          </div>
          <label className="mt-6 flex cursor-pointer items-center gap-2 text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={form.sold}
              onChange={(e) => setForm((f) => ({ ...f, sold: e.target.checked }))}
              className="size-4 rounded border-secondary text-accent focus:ring-accent"
            />
            Markér som solgt
          </label>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" disabled={pending} onClick={save} className="btn-outline">
              Gem
            </button>
            <button type="button" onClick={cancelForm} className="btn-outline-dark">
              Annuller
            </button>
          </div>
        </div>
      ) : null}

      <ul className="space-y-6">
        {items.map((p) => (
          <li key={p.id} className="section-rule pt-6 first:border-0 first:pt-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="h-28 w-40 shrink-0 overflow-hidden border border-secondary/50 bg-paper-warm">
                <ArtworkImage src={p.image} alt="" className="size-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-serif text-lg text-ink">{p.title}</h2>
                <p className="mt-1 text-accent">{formatPriceDKK(p.price)}</p>
                <p className="mt-2 line-clamp-2 text-sm text-ink-muted">{p.description}</p>
                <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-ink-muted">
                  <input
                    type="checkbox"
                    checked={p.sold === true}
                    disabled={togglingId === p.id}
                    onChange={(e) => void toggleSold(p, e.target.checked)}
                    className="size-4 rounded border-secondary text-accent focus:ring-accent"
                  />
                  Markér som solgt
                </label>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (editingId === p.id) return;
                      if (editingId === "new") cancelForm();
                      startEdit(p);
                    }}
                    className="btn-outline text-[11px]"
                  >
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
            </div>

            {editingId === p.id ? (
              <div className="mt-6 rounded border border-secondary/50 bg-paper-warm/40 p-6">
                <h3 className="font-serif text-lg text-ink">Rediger maleri</h3>
                <div className="mt-4">
                  <FormFields form={form} setForm={setForm} />
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button type="button" disabled={pending} onClick={save} className="btn-outline">
                    Gem
                  </button>
                  <button type="button" onClick={cancelForm} className="btn-outline-dark">
                    Annuller
                  </button>
                </div>
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      {msg ? <p className="text-sm text-accent">{msg}</p> : null}
      {err ? <p className="text-sm text-rose-dust">{err}</p> : null}
    </div>
  );
}
