"use client";

import { useEffect, useState } from "react";
import { UploadForm } from "@/components/UploadForm";
import { ArtworkImage } from "@/components/artwork-image";
import type { AboutData } from "@/types/content";

type Props = { initial: AboutData };

type AboutResponse = AboutData & { error?: string };

const MAX_HERO_IMAGES = 5;

function slotsFromAbout(a: AboutData): string[] {
  return [
    (a.heroImage1 ?? "").trim(),
    (a.heroImage2 ?? "").trim(),
    (a.heroImage3 ?? "").trim(),
    (a.heroImage4 ?? "").trim(),
    (a.heroImage5 ?? "").trim(),
  ];
}

/** Fjern tomme huller — billederne ligger altid i 1..n. */
function packSlots(slots: string[]): string[] {
  const filled = slots.filter((s) => s.length > 0);
  return [0, 1, 2, 3, 4].map((i) => filled[i] ?? "");
}

function minVisibleRows(slots: string[]): number {
  let lastFilled = -1;
  for (let i = 0; i < MAX_HERO_IMAGES; i++) {
    if (slots[i]) lastFilled = i;
  }
  if (lastFilled === -1) return 1;
  if (lastFilled === MAX_HERO_IMAGES - 1) return MAX_HERO_IMAGES;
  return Math.min(MAX_HERO_IMAGES, lastFilled + 2);
}

function slotsToPayload(slots: string[]) {
  const p = packSlots(slots);
  return {
    heroImage1: p[0] ?? "",
    heroImage2: p[1] ?? "",
    heroImage3: p[2] ?? "",
    heroImage4: p[3] ?? "",
    heroImage5: p[4] ?? "",
  };
}

export function FrontpageAdmin({ initial }: Props) {
  const [heroTitle, setHeroTitle] = useState(initial.heroTitle ?? "");
  const [heroSubtitle, setHeroSubtitle] = useState(initial.heroSubtitle ?? "");
  const [heroDescription, setHeroDescription] = useState(initial.heroDescription ?? "");
  const [slots, setSlots] = useState<string[]>(() => packSlots(slotsFromAbout(initial)));
  const [visibleRows, setVisibleRows] = useState(() => minVisibleRows(packSlots(slotsFromAbout(initial))));

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
      const next = packSlots(slotsFromAbout(data));
      setSlots(next);
      setVisibleRows(minVisibleRows(next));
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
    const packed = packSlots(slots);
    const res = await fetch("/api/about", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(slotsToPayload(packed)),
    });
    setPendingImages(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setImgErr(j.error ?? "Kunne ikke gemme billeder.");
      return;
    }
    setSlots(packed);
    setVisibleRows(minVisibleRows(packed));
    setImgMsg("Baggrundsbilleder er gemt.");
  }

  function setSlotAt(index: number, url: string) {
    setSlots((prev) => {
      const next = [...prev];
      next[index] = url;
      return next;
    });
  }

  function removeAt(index: number) {
    const next = [...slots];
    next[index] = "";
    const packed = packSlots(next);
    setSlots(packed);
    setVisibleRows(minVisibleRows(packed));
  }

  const filledCount = slots.filter(Boolean).length;

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
          Upload op til {MAX_HERO_IMAGES} billeder til forsiden. Du starter med én upload-række — tryk{" "}
          <span className="font-medium text-ink">+</span> for at tilføje plads til flere (højst{" "}
          {MAX_HERO_IMAGES}).
        </p>
        <p className="mt-1 text-xs text-ink-muted">
          {filledCount} / {MAX_HERO_IMAGES} billeder
        </p>

        <div className="mt-6 space-y-6">
          {Array.from({ length: visibleRows }, (_, rowIndex) => (
            <div
              key={rowIndex}
              className="rounded border border-secondary/50 bg-paper p-4"
            >
              <p className="mb-2 text-sm font-medium text-ink">Billede {rowIndex + 1}</p>
              <UploadForm
                folder="hero"
                label="Upload billede"
                onUploaded={(url) => setSlotAt(rowIndex, url)}
              />
              {slots[rowIndex] ? (
                <div className="mt-3 space-y-2">
                  <div className="h-40 overflow-hidden border border-secondary/50">
                    <ArtworkImage src={slots[rowIndex]} alt="" className="h-full w-full object-cover" />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAt(rowIndex)}
                    className="btn-outline border-rose-dust/50 text-rose-dust hover:bg-rose-dust/10"
                  >
                    Fjern billede
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>

        {visibleRows < MAX_HERO_IMAGES ? (
          <button
            type="button"
            onClick={() => setVisibleRows((v) => Math.min(MAX_HERO_IMAGES, v + 1))}
            className="mt-4 flex h-12 w-full items-center justify-center rounded border border-dashed border-secondary/70 bg-paper-warm/50 text-lg font-medium text-ink-muted transition hover:border-accent/50 hover:bg-linen/50 hover:text-ink"
            aria-label="Tilføj endnu et billede-felt"
          >
            + Tilføj billede-plads ({visibleRows}/{MAX_HERO_IMAGES})
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => void saveImages()}
          disabled={pendingImages}
          className="btn-outline mt-6"
        >
          {pendingImages ? "Gemmer..." : "Gem billeder"}
        </button>
        {imgMsg ? <p className="mt-3 text-sm text-accent">{imgMsg}</p> : null}
        {imgErr ? <p className="mt-3 text-sm text-rose-dust">{imgErr}</p> : null}
      </section>
    </div>
  );
}
