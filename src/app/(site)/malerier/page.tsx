import type { Metadata } from "next";
import { FadeInSection } from "@/components/fade-in-section";
import { GalleryGrid } from "@/components/GalleryGrid";
import { SitePageHeader } from "@/components/site-page-header";
import { getAbout, getPaintings } from "@/lib/data";

const artistName = (process.env.ARTIST_NAME ?? "Kunstnernavn").trim() || "Kunstnernavn";

export const metadata: Metadata = {
  title: { absolute: `Malerier — ${artistName}` },
  description: `Se alle malerier af ${artistName}`,
};

export default async function PaintingsPage() {
  const [items, about] = await Promise.all([getPaintings(), getAbout()]);
  const sorted = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const intro =
    about.galleryPaintingsDescription?.trim() ||
    "Originale malerier med nordisk ro — hvert værk er unikt og malet i atelieret.";

  return (
    <div>
      <FadeInSection>
        <SitePageHeader
          eyebrow="Originale værker"
          title="Malerier"
          subtitle={intro}
        />
      </FadeInSection>
      <div className="mx-auto max-w-7xl px-6 pb-24 md:px-12 md:pb-32">
        {sorted.length === 0 ? (
          <p className="py-24 text-center text-base italic text-gray-500">
            Værker tilføjes løbende. Vend tilbage snart.
          </p>
        ) : (
          <GalleryGrid items={sorted} basePath="/malerier" />
        )}
      </div>
    </div>
  );
}
