import type { Metadata } from "next";
import { FadeInSection } from "@/components/fade-in-section";
import { SitePageHeader } from "@/components/site-page-header";
import { ContactSection } from "./contact-section";
import { canUseSupabaseContactRead, readContactFromSupabase } from "@/lib/supabase-contact";

export const dynamic = "force-dynamic";
const artistName = (process.env.ARTIST_NAME ?? "Kunstnernavn").trim() || "Kunstnernavn";

export const metadata: Metadata = {
  title: { absolute: `Kontakt — ${artistName}` },
  description: `Tag kontakt til ${artistName}`,
};
const email = process.env.CONTACT_EMAIL ?? "ingrid@example.com";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function pickString(v: string | string[] | undefined): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return undefined;
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const sp = searchParams ? await searchParams : {};
  const vare = pickString(sp.vare);
  const type = pickString(sp.type);
  let facebookUrl = "";
  let instagramUrl = "";
  if (canUseSupabaseContactRead()) {
    try {
      const row = await readContactFromSupabase();
      if (row) {
        facebookUrl = row.facebookUrl;
        instagramUrl = row.instagramUrl;
      }
    } catch {
      // Ingen links ved midlertidig fejl eller tom række.
    }
  }

  let initialMessage = "";
  if (vare) {
    const kind = type === "smykke" ? "smykket" : "maleriet";
    initialMessage = `Hej ${artistName},\n\nJeg skriver vedrørende ${kind} «${decodeURIComponent(vare)}».\n\n`;
  }

  return (
    <div>
      <FadeInSection>
        <SitePageHeader
          eyebrow="Atelier"
          title="Kontakt"
          subtitle={`Tag kontakt til ${artistName} — bestillinger, udstillinger eller et uforpligtende spørgsmål om et værk.`}
        />
      </FadeInSection>
      <div className="mx-auto max-w-3xl px-6 pb-24 md:px-12 md:pb-32">
        <ContactSection
          key={vare ?? "kontakt"}
          email={email}
          facebookUrl={facebookUrl}
          instagramUrl={instagramUrl}
          initialMessage={initialMessage}
          artistName={artistName}
        />
      </div>
    </div>
  );
}
