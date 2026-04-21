"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { UploadForm } from "@/components/UploadForm";
import type { AboutData, CvEntry } from "@/types/content";

type Props = {
  initial: AboutData;
};

export function AboutAdmin({ initial }: Props) {
  const router = useRouter();
  const [biography, setBiography] = useState(initial.biography);
  const [artistPhoto, setArtistPhoto] = useState(initial.artistPhoto);
  const [cvEntries, setCvEntries] = useState<CvEntry[]>(initial.cvEntries);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function addCv() {
    setCvEntries((prev) => [...prev, { id: `cv-${Date.now()}`, year: "", text: "" }]);
  }

  function updateCv(i: number, patch: Partial<CvEntry>) {
    setCvEntries((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], ...patch };
      return next;
    });
  }

  function removeCv(i: number) {
    setCvEntries((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function save() {
    setErr(null);
    setMsg(null);
    setPending(true);
    const res = await fetch("/api/about", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        biography: biography.trim(),
        artistPhoto: artistPhoto.trim(),
        cvEntries,
      }),
    });
    setPending(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setErr(j.error ?? "Kunne ikke gemme.");
      return;
    }
    setMsg("Om-siden er opdateret.");
    router.refresh();
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-serif text-3xl text-ink">Om kunstneren</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Biografi, CV og portræt vises på den offentlige side under «Om».
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="font-serif text-xl text-ink">Biografi</h2>
        <textarea
          value={biography}
          onChange={(e) => setBiography(e.target.value)}
          rows={12}
          className="w-full border border-secondary/60 bg-paper px-4 py-3 text-sm leading-relaxed text-ink"
        />
      </section>

      <section className="section-rule space-y-4 pt-10">
        <h2 className="font-serif text-xl text-ink">Portrætfoto</h2>
        <UploadForm
          folder="artist"
          label="Upload portræt (gemmes under /uploads/artist/)"
          onUploaded={(url) => setArtistPhoto(url)}
        />
        <label className="block text-sm text-ink-muted">
          Billede-URL
          <input
            value={artistPhoto}
            onChange={(e) => setArtistPhoto(e.target.value)}
            className="mt-1 w-full border border-secondary/60 bg-paper px-3 py-2 text-sm text-ink"
            placeholder="/uploads/artist/…"
          />
        </label>
      </section>

      <section className="section-rule space-y-6 pt-10">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-serif text-xl text-ink">CV / udstillinger</h2>
          <button type="button" onClick={addCv} className="btn-outline text-[11px]">
            Tilføj linje
          </button>
        </div>
        <ul className="space-y-4">
          {cvEntries.map((entry, i) => (
            <li key={entry.id} className="rounded border border-secondary/50 bg-paper-warm/50 p-4">
              <div className="grid gap-3 sm:grid-cols-[100px_1fr_auto]">
                <label className="text-sm text-ink-muted">
                  År
                  <input
                    value={entry.year}
                    onChange={(e) => updateCv(i, { year: e.target.value })}
                    className="mt-1 w-full border border-secondary/60 bg-paper px-2 py-2 text-sm"
                  />
                </label>
                <label className="text-sm text-ink-muted sm:col-span-1">
                  Tekst
                  <textarea
                    value={entry.text}
                    onChange={(e) => updateCv(i, { text: e.target.value })}
                    rows={2}
                    className="mt-1 w-full border border-secondary/60 bg-paper px-2 py-2 text-sm"
                  />
                </label>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeCv(i)}
                    className="text-sm text-ink-muted underline hover:text-ink"
                  >
                    Fjern
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <button type="button" disabled={pending} onClick={save} className="btn-outline">
        Gem alt
      </button>

      {msg ? <p className="text-sm text-accent">{msg}</p> : null}
      {err ? <p className="text-sm text-rose-dust">{err}</p> : null}
    </div>
  );
}
