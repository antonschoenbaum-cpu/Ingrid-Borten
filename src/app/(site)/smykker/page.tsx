import type { Metadata } from "next";
import { FadeInSection } from "@/components/fade-in-section";
import { GalleryGrid } from "@/components/GalleryGrid";
import { SitePageHeader } from "@/components/site-page-header";
import { getAbout, getJewelry } from "@/lib/data";

const artistName = (process.env.ARTIST_NAME ?? "Kunstnernavn").trim() || "Kunstnernavn";

export const metadata: Metadata = {
  title: { absolute: `Smykker — ${artistName}` },
  description: `Se alle smykker og håndlavede æringe af ${artistName}`,
};

export default async function JewelryPage() {
  const [items, about] = await Promise.all([getJewelry(), getAbout()]);
  const sorted = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const intro =
    about.galleryJewelryDescription?.trim() ||
    "Håndlavede smykker med ro og varme — metal og form i samspil med naturen.";

  return (
    <div>
      <FadeInSection>
        <SitePageHeader eyebrow="Smykker" title="Smykker" subtitle={intro} />
      </FadeInSection>
      <div className="mx-auto max-w-7xl px-6 pb-24 md:px-12 md:pb-32">
        {sorted.length === 0 ? (
          <p className="py-24 text-center text-base italic text-gray-500">
            Værker tilføjes løbende. Vend tilbage snart.
          </p>
        ) : (
          <GalleryGrid items={sorted} basePath="/smykker" />
        )}
      </div>
    </div>
  );
}
