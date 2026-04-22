"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { UploadForm } from "@/components/UploadForm";
import type { AboutData } from "@/types/content";

type Props = {
  initial: AboutData;
};

export function AboutAdmin({ initial }: Props) {
  const router = useRouter();
  const [biography, setBiography] = useState(initial.biography);
  const [artistPhoto, setArtistPhoto] = useState(initial.artistPhoto);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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
          Biografi og portræt vises på den offentlige side under «Om Ingrid». Udstillinger i CV
          hentes automatisk fra afsluttede begivenheder under Begivenheder.
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

      <button type="button" disabled={pending} onClick={save} className="btn-outline">
        Gem
      </button>

      {msg ? <p className="text-sm text-accent">{msg}</p> : null}
      {err ? <p className="text-sm text-rose-dust">{err}</p> : null}
    </div>
  );
}
