"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArtworkImage } from "@/components/artwork-image";
import { UploadForm } from "@/components/UploadForm";
import {
  formatEventOpensDanish,
  formatEventUntilDanish,
} from "@/lib/format";
import type { EventItem } from "@/types/content";

type Props = {
  initial: EventItem[];
};

function todayYmdCopenhagen(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Copenhagen" });
}

function defaultNewStart(): string {
  return `${todayYmdCopenhagen()}T18:00`;
}

function toDatetimeLocalInput(isoLike: string): string {
  const s = isoLike.trim();
  const m = s.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})/);
  if (m) return `${m[1]}T${m[2]}:${m[3]}`;
  return `${s.slice(0, 10)}T12:00`;
}

const empty = {
  title: "",
  description: "",
  start_datetime: "",
  end_date: "",
  location: "",
  image: "",
};

function EventFormFields({
  form,
  setForm,
}: {
  form: typeof empty;
  setForm: React.Dispatch<React.SetStateAction<typeof empty>>;
}) {
  return (
    <div className="space-y-6">
      <UploadForm
        folder="events"
        label="Vælg et billede fra din computer"
        onUploaded={(url) => setForm((f) => ({ ...f, image: url }))}
      />
      <label className="block text-sm text-ink-muted">
        Billede-URL (valgfrit)
        <input
          value={form.image}
          onChange={(ev) => setForm((f) => ({ ...f, image: ev.target.value }))}
          className="mt-1 w-full border border-secondary/60 bg-paper px-3 py-2 text-sm text-ink"
          placeholder="/uploads/events/… eller ekstern URL"
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
        Startdato og åbningstidspunkt
        <input
          type="datetime-local"
          value={form.start_datetime}
          onChange={(ev) => setForm((f) => ({ ...f, start_datetime: ev.target.value }))}
          className="mt-1 w-full border border-secondary/60 bg-paper px-3 py-2 text-sm text-ink"
          required
        />
        <span className="mt-1 block text-xs text-ink-muted/80">
          Vises fx som: «Åbner: 14. juni 2025 kl. 18.00» (efter du har gemt).
        </span>
      </label>
      <label className="block text-sm text-ink-muted">
        Slutdato
        <input
          type="date"
          value={form.end_date}
          onChange={(ev) => setForm((f) => ({ ...f, end_date: ev.target.value }))}
          className="mt-1 w-full border border-secondary/60 bg-paper px-3 py-2 text-sm text-ink"
          required
        />
        <span className="mt-1 block text-xs text-ink-muted/80">
          Vises fx som: «Lukker: 20. juni 2025» — kun dato, ikke klokkeslæt.
        </span>
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
    </div>
  );
}

export function EventsAdmin({ initial }: Props) {
  const router = useRouter();
  const items = initial;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  function startEdit(e: EventItem) {
    if (editingId === "new") {
      setEditingId(null);
      setForm(empty);
    }
    setEditingId(e.id);
    setForm({
      title: e.title,
      description: e.description,
      start_datetime: toDatetimeLocalInput(e.start_date),
      end_date: e.end_date.slice(0, 10),
      location: e.location,
      image: e.image ?? "",
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
    setForm({
      ...empty,
      start_datetime: defaultNewStart(),
      end_date: todayYmdCopenhagen(),
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
    const startTrim = form.start_datetime.trim();
    const endTrim = form.end_date.trim().slice(0, 10);
    const imageTrim = form.image.trim();
    const body = {
      title: form.title.trim(),
      description: form.description,
      start_date: startTrim.length === 16 ? `${startTrim}:00` : startTrim,
      end_date: endTrim,
      location: form.location.trim(),
      image: imageTrim === "" ? null : imageTrim,
    };
    if (!body.title || !body.location || !startTrim || !endTrim) {
      setErr("Titel, startdato med tid, slutdato og sted er påkrævet.");
      return;
    }
    if (endTrim < startTrim.slice(0, 10)) {
      setErr("Slutdato kan ikke være før startdato.");
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
      setErr(j.error ?? `Kunne ikke gemme (HTTP ${res.status}).`);
      return;
    }
    setMsg(isNew ? "Begivenhed oprettet." : "Begivenhed opdateret.");
    setEditingId(null);
    setForm(empty);
    setErr(null);
    router.refresh();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const { id, title } = deleteTarget;
    const wasEditingThis = editingId === id;
    setErr(null);
    setDeletePending(true);
    const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
    setDeletePending(false);
    setDeleteTarget(null);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setErr(j.error ?? `Kunne ikke slette (HTTP ${res.status}).`);
      return;
    }
    if (wasEditingThis) cancelForm();
    setMsg(`«${title}» er slettet permanent.`);
    router.refresh();
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-serif text-3xl text-ink">Begivenheder</h1>
        <p className="mt-2 text-sm text-ink-muted">Udstillinger på «Om» hentes fra afsluttede begivenheder.</p>
      </div>

      <button type="button" onClick={startNew} className="btn-outline">
        {editingId === "new" ? "Luk ny begivenhed" : "Tilføj ny begivenhed"}
      </button>

      {editingId === "new" ? (
        <div className="rounded border border-secondary/50 bg-paper-warm/40 p-6">
          <h2 className="font-serif text-xl text-ink">Ny begivenhed</h2>
          <div className="mt-6">
            <EventFormFields form={form} setForm={setForm} />
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
              <p className="mt-1 text-xs text-accent">{formatEventOpensDanish(e.start_date)}</p>
              <p className="text-xs text-ink-muted">{formatEventUntilDanish(e.end_date)}</p>
              <p className="mt-1 text-sm text-ink-muted">{e.location}</p>
              <p className="mt-2 line-clamp-2 text-sm text-ink-muted">{e.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (editingId === e.id) return;
                    if (editingId === "new") cancelForm();
                    startEdit(e);
                  }}
                  className="btn-outline text-[11px]"
                >
                  Rediger
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget({ id: e.id, title: e.title })}
                  className="btn-outline border-rose-dust/50 text-rose-dust hover:bg-rose-dust/10"
                >
                  Slet
                </button>
              </div>

              {editingId === e.id ? (
                <div className="mt-6 rounded border border-secondary/50 bg-paper-warm/40 p-6">
                  <h3 className="font-serif text-lg text-ink">Rediger begivenhed</h3>
                  <div className="mt-4">
                    <EventFormFields form={form} setForm={setForm} />
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
            </div>
          </li>
        ))}
      </ul>

      {deleteTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          role="presentation"
          onClick={() => !deletePending && setDeleteTarget(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-event-title"
            className="max-w-md rounded border border-secondary/50 bg-paper p-6 shadow-lg"
            onClick={(ev) => ev.stopPropagation()}
          >
            <h2 id="delete-event-title" className="font-serif text-xl text-ink">
              Slet begivenhed?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              Er du sikker på, at du vil slette opslaget{" "}
              <span className="font-medium text-ink">«{deleteTarget.title}»</span>? Dette kan ikke
              fortrydes — begivenheden fjernes permanent fra listen og den offentlige side.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                disabled={deletePending}
                onClick={() => setDeleteTarget(null)}
                className="btn-outline-dark"
              >
                Annuller
              </button>
              <button
                type="button"
                disabled={deletePending}
                onClick={() => void confirmDelete()}
                className="btn-outline border-rose-dust/60 text-rose-dust hover:bg-rose-dust/10"
              >
                {deletePending ? "Sletter…" : "Bekræft og slet"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {msg ? <p className="text-sm text-accent">{msg}</p> : null}
      {err ? <p className="text-sm text-rose-dust">{err}</p> : null}
    </div>
  );
}
