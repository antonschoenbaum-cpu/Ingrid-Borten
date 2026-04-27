import type { Metadata } from "next";
import { ContactSection } from "./contact-section";
import { getContactLinks } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kontakt",
};

const artistName = (process.env.ARTIST_NAME ?? "Kunstnernavn").trim() || "Kunstnernavn";
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
  const { facebookUrl, instagramUrl } = await getContactLinks();

  let initialMessage = "";
  if (vare) {
    const kind = type === "smykke" ? "smykket" : "maleriet";
    initialMessage = `Hej ${artistName},\n\nJeg skriver vedrørende ${kind} «${decodeURIComponent(vare)}».\n\n`;
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 md:px-8 md:py-24">
      <header className="mb-12 text-center">
        <h1 className="font-serif text-4xl text-ink md:text-5xl">Kontakt</h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-muted">
          {`Tag kontakt til ${artistName}`}
        </p>
      </header>

      <ContactSection
        key={vare ?? "kontakt"}
        email={email}
        facebookUrl={facebookUrl}
        instagramUrl={instagramUrl}
        initialMessage={initialMessage}
        artistName={artistName}
      />
    </div>
  );
}
