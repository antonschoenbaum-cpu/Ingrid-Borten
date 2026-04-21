import type { Metadata } from "next";
import { GalleryGrid } from "@/components/GalleryGrid";
import { getPaintings } from "@/lib/data";

export const metadata: Metadata = {
  title: "Malerier",
};

export default async function PaintingsPage() {
  const items = await getPaintings();
  const sorted = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-20">
      <header className="section-rule mb-12 max-w-2xl pb-12">
        <h1 className="font-serif text-4xl text-ink md:text-5xl">Malerier</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-muted">
          Oliemalerier bygget i lag — farver, tekstur og rum. Vælg et værk for at se pris,
          beskrivelse og forespørgselslink.
        </p>
      </header>
      <GalleryGrid items={sorted} basePath="/malerier" />
    </div>
  );
}
