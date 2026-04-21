"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArtworkImage } from "@/components/artwork-image";
import { UploadForm } from "@/components/UploadForm";
import { formatEventDate } from "@/lib/format";
import type { EventItem } from "@/types/content";

type Props = {
  initial: EventItem[];
};

const empty = { title: "", description: "", date: "", location: "", image: "" };

export function EventsAdmin({ initial }: Props) {
  const router = useRouter();
  const items = initial;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function startEdit(e: EventItem) {
    setEditingId(e.id);
    setForm({
      title: e.title,
      description: e.description,
      date: e.date.length >= 10 ? e.date.slice(0, 10) : e.date,
      location: e.location,
      image: e.image ?? "",
    });
    setMsg(null);
    setErr(null);
  }

  function startNew() {
    setEditingId("new");
    setForm({
      ...empty,
      date: new Date().toISOString().slice(0, 10),
    });
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
    const imageTrim = form.image.trim();
    const body = {
      title: form.title.trim(),
      description: form.description,
      date: form.date.trim(),
      location: form.location.trim(),
      image: imageTrim === "" ? null : imageTrim,
    };
    if (!body.title || !body.date || !body.location) {
      setErr("Titel, dato og sted er påkrævet.");
      return;
    }

    setPending(true);
    const isNew = editingId === "new";
    const url = isNew ? "/api/events" : `/api/events/${editingId}`;
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
    setMsg(isNew ? "Begivenhed oprettet." : "Begivenhed opdateret.");
    cancelForm();
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Slette denne begivenhed?")) return;
    setErr(null);
    const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setErr("Kunne ikke slette.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-serif text-3xl text-ink">Begivenheder</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Valgfrit billede gemmes under <code className="text-xs">/public/uploads/events/</code>.
        </p>
      </div>

      <ul className="space-y-6">
        {items.map((e) => (
          <li
            key={e.id}
            className="section-rule flex flex-col gap-4 pt-6 first:border-0 first:pt-0 sm:flex-row sm:items-start"
          >
            <div className="h-24 w-36 shrink-0 overflow-hidden border border-secondary/50 bg-paper-warm">
              {e.image ? (
                <ArtworkImage src={e.image} alt="" className="size-full object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center text-xs text-ink-muted">
                  Intet billede
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-serif text-lg text-ink">{e.title}</h2>
              <p className="mt-1 text-xs uppercase tracking-wider text-accent">
                {formatEventDate(e.date)}
              </p>
              <p className="text-sm text-ink-muted">{e.location}</p>
              <p className="mt-2 line-clamp-2 text-sm text-ink-muted">{e.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => startEdit(e)} className="btn-outline text-[11px]">
                  Rediger
                </button>
                <button
                  type="button"
                  onClick={() => remove(e.id)}
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
            Tilføj ny begivenhed
          </button>
        ) : (
          <div className="space-y-6 rounded border border-secondary/50 bg-paper-warm/40 p-6">
            <h2 className="font-serif text-xl text-ink">
              {editingId === "new" ? "Ny begivenhed" : "Rediger begivenhed"}
            </h2>
            <UploadForm
              folder="events"
              label="Upload billede (valgfrit)"
              onUploaded={(url) => setForm((f) => ({ ...f, image: url }))}
            />
            <label className="block text-sm text-ink-muted">
              Billede-URL (valgfrit)
              <input
                value={form.image}
                onChange={(ev) => setForm((f) => ({ ...f, image: ev.target.value }))}
                className="mt-1 w-full border border-secondary/60 bg-paper px-3 py-2 text-sm text-ink"
                placeholder="/uploads/events/…"
              />
            </label>
            <label className="block text-sm text-ink-muted">
              Titel
              <input
                value={form.title}
                onChange={(ev) => setForm((f) => ({ ...f, title: ev.target.value }))}
                className="mt-1 w-full border border-secondary/60 bg-paper px-3 py-2 text-sm text-ink"
              />
            </label>
            <label className="block text-sm text-ink-muted">
              Dato
              <input
                type="date"
                value={form.date}
                onChange={(ev) => setForm((f) => ({ ...f, date: ev.target.value }))}
                className="mt-1 w-full border border-secondary/60 bg-paper px-3 py-2 text-sm text-ink"
              />
            </label>
            <label className="block text-sm text-ink-muted">
              Sted / lokation
              <input
                value={form.location}
                onChange={(ev) => setForm((f) => ({ ...f, location: ev.target.value }))}
                className="mt-1 w-full border border-secondary/60 bg-paper px-3 py-2 text-sm text-ink"
              />
            </label>
            <label className="block text-sm text-ink-muted">
              Beskrivelse
              <textarea
                value={form.description}
                onChange={(ev) => setForm((f) => ({ ...f, description: ev.target.value }))}
                rows={4}
                className="mt-1 w-full border border-secondary/60 bg-paper px-3 py-2 text-sm text-ink"
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
