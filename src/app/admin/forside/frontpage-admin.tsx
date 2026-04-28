"use client";

import { useEffect, useState } from "react";
import { UploadForm } from "@/components/UploadForm";
import { ArtworkImage } from "@/components/artwork-image";
import type { AboutData } from "@/types/content";

type Props = { initial: AboutData };

type AboutResponse = AboutData & { error?: string };

export function FrontpageAdmin({ initial }: Props) {
  const [heroTitle, setHeroTitle] = useState(initial.heroTitle ?? "");
  const [heroSubtitle, setHeroSubtitle] = useState(initial.heroSubtitle ?? "");
  const [heroDescription, setHeroDescription] = useState(initial.heroDescription ?? "");
  const [heroImage1, setHeroImage1] = useState(initial.heroImage1 ?? "");
  const [heroImage2, setHeroImage2] = useState(initial.heroImage2 ?? "");
  const [heroImage3, setHeroImage3] = useState(initial.heroImage3 ?? "");
  const [heroImage4, setHeroImage4] = useState(initial.heroImage4 ?? "");
  const [heroImage5, setHeroImage5] = useState(initial.heroImage5 ?? "");
  const [pendingText, setPendingText] = useState(false);
  const [pendingImages, setPendingImages] = useState(false);
  const [textMsg, setTextMsg] = useState<string | null>(null);
  const [textErr, setTextErr] = useState<string | null>(null);
  const [imgMsg, setImgMsg] = useState<string | null>(null);
  const [imgErr, setImgErr] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/about", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as AboutResponse;
      setHeroTitle(data.heroTitle ?? "");
      setHeroSubtitle(data.heroSubtitle ?? "");
      setHeroDescription(data.heroDescription ?? "");
      setHeroImage1(data.heroImage1 ?? "");
      setHeroImage2(data.heroImage2 ?? "");
      setHeroImage3(data.heroImage3 ?? "");
      setHeroImage4(data.heroImage4 ?? "");
      setHeroImage5(data.heroImage5 ?? "");
    }
    void load();
  }, []);

  async function saveTexts() {
    setTextErr(null);
    setTextMsg(null);
    setPendingText(true);
    const res = await fetch("/api/about", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        heroTitle: heroTitle.slice(0, 120),
        heroSubtitle: heroSubtitle.slice(0, 160),
        heroDescription: heroDescription.slice(0, 300),
      }),
    });
    setPendingText(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setTextErr(j.error ?? "Kunne ikke gemme tekster.");
      return;
    }
    setTextMsg("Forsidetekster er gemt.");
  }

  async function saveImages() {
    setImgErr(null);
    setImgMsg(null);
    setPendingImages(true);
    const res = await fetch("/api/about", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        heroImage1,
        heroImage2,
        heroImage3,
        heroImage4,
        heroImage5,
      }),
    });
    setPendingImages(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setImgErr(j.error ?? "Kunne ikke gemme billeder.");
      return;
    }
    setImgMsg("Baggrundsbilleder er gemt.");
  }

  const imageFields = [
    { label: "Billede 1", value: heroImage1, set: setHeroImage1 },
    { label: "Billede 2", value: heroImage2, set: setHeroImage2 },
    { label: "Billede 3", value: heroImage3, set: setHeroImage3 },
    { label: "Billede 4", value: heroImage4, set: setHeroImage4 },
    { label: "Billede 5", value: heroImage5, set: setHeroImage5 },
  ] as const;

  return (
    <div className="space-y-10">
      <section className="rounded border border-secondary/50 bg-paper-warm/40 p-6">
        <h1 className="font-serif text-2xl text-ink">Forsidets tekster</h1>
        <p className="mt-2 text-sm text-ink-muted">Rediger teksterne der vises på din forside.</p>

        <div className="mt-6 space-y-5">
          <label className="block text-sm text-ink-muted">
            Stor overskrift
            <textarea
              value={heroTitle}
              maxLength={120}
              onChange={(e) => setHeroTitle(e.target.value)}
              className="mt-1 w-full border border-secondary/60 bg-paper px-3 py-2 text-sm text-ink"
              placeholder="Penselstrøg og metal formet i takt med naturens stille fortællinger."
              rows={3}
            />
            <span className="mt-1 block text-xs text-ink-muted">Den store tekst øverst på forsiden</span>
          </label>

          <label className="block text-sm text-ink-muted">
            Undertekst
            <input
              value={heroSubtitle}
              maxLength={160}
              onChange={(e) => setHeroSubtitle(e.target.value)}
              className="mt-1 w-full border border-secondary/60 bg-paper px-3 py-2 text-sm text-ink"
              placeholder="Velkommen til et rum for maleri og smykker"
            />
            <span className="mt-1 block text-xs text-ink-muted">Den lille tekst under overskriften</span>
          </label>

          <label className="block text-sm text-ink-muted">
            Beskrivelse
            <textarea
              value={heroDescription}
              maxLength={300}
              onChange={(e) => setHeroDescription(e.target.value)}
              className="mt-1 w-full border border-secondary/60 bg-paper px-3 py-2 text-sm text-ink"
              placeholder="Ingrid arbejder på grænsen mellem maleri og skulptur..."
              rows={4}
            />
            <span className="mt-1 block text-xs text-ink-muted">
              Teksten midt på forsiden der beskriver dig og dit arbejde
            </span>
          </label>
        </div>

        <button type="button" onClick={() => void saveTexts()} disabled={pendingText} className="btn-outline mt-6">
          {pendingText ? "Gemmer..." : "Gem"}
        </button>
        {textMsg ? <p className="mt-3 text-sm text-accent">{textMsg}</p> : null}
        {textErr ? <p className="mt-3 text-sm text-rose-dust">{textErr}</p> : null}
      </section>

      <section className="rounded border border-secondary/50 bg-paper-warm/40 p-6">
        <h2 className="font-serif text-2xl text-ink">Baggrundsbilleder</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Upload op til 5 billeder der vises diskret i baggrunden på forsiden. Brug dine bedste og
          mest stemningsfulde billeder.
        </p>

        <div className="mt-6 grid gap-6">
          {imageFields.map((f) => (
            <div key={f.label} className="rounded border border-secondary/50 bg-paper p-4">
              <p className="mb-2 font-medium text-ink">{f.label}</p>
              <UploadForm folder="hero" label="Upload billede" onUploaded={(url) => f.set(url)} />
              {f.value ? (
                <div className="mt-3 space-y-2">
                  <div className="h-40 overflow-hidden border border-secondary/50">
                    <ArtworkImage src={f.value} alt="" className="h-full w-full object-cover" />
                  </div>
                  <button
                    type="button"
                    onClick={() => f.set("")}
                    className="btn-outline border-rose-dust/50 text-rose-dust hover:bg-rose-dust/10"
                  >
                    Fjern billede
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => void saveImages()}
          disabled={pendingImages}
          className="btn-outline mt-6"
        >
          {pendingImages ? "Gemmer..." : "Gem"}
        </button>
        {imgMsg ? <p className="mt-3 text-sm text-accent">{imgMsg}</p> : null}
        {imgErr ? <p className="mt-3 text-sm text-rose-dust">{imgErr}</p> : null}
      </section>
    </div>
  );
}

