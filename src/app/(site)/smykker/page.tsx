import type { Metadata } from "next";
import { GalleryGrid } from "@/components/GalleryGrid";
import { getJewelry } from "@/lib/data";

export const metadata: Metadata = {
  title: "Smykker",
};

export default async function JewelryPage() {
  const items = await getJewelry();
  const sorted = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-20">
      <header className="section-rule mb-12 max-w-2xl pb-12">
        <h1 className="font-serif text-4xl text-ink md:text-5xl">Smykker</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-muted">
          Håndlavede øreringe og smykker med skulpturel karakter. Vælg et værk for detaljer
          og forespørgsel.
        </p>
      </header>
      <GalleryGrid items={sorted} basePath="/smykker" />
    </div>
  );
}
