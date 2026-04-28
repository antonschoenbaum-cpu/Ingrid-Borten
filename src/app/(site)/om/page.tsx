import type { Metadata } from "next";
import Link from "next/link";
import { ArtworkImage } from "@/components/artwork-image";
import { formatPastEventCvLine, isEventPastByEndDate } from "@/lib/format";
import { getAbout, getEvents } from "@/lib/data";
import { toMetaDescription } from "@/lib/seo";

const artistName = (process.env.ARTIST_NAME ?? "Kunstnernavn").trim() || "Kunstnernavn";

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAbout();
  return {
    title: { absolute: `Om ${artistName}` },
    description: toMetaDescription(about.heroDescription, 160),
  };
}

const quickNav = [
  { href: "#biografi", label: "Biografi" },
  { href: "#portraet", label: "Portræt" },
  { href: "#udstillinger", label: "Udstillinger" },
] as const;

export default async function OmPage() {
  const [about, events] = await Promise.all([getAbout(), getEvents()]);
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: artistName,
    description: about.biography,
    image: about.artistPhoto,
    jobTitle: "Kunstner",
  };
  const pastExhibitions = events
    .filter((e) => isEventPastByEndDate(e.end_date))
    .sort((a, b) => b.end_date.localeCompare(a.end_date));

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <header className="relative h-[min(55vh,520px)] w-full overflow-hidden">
        <ArtworkImage
          src="/uploads/about-header.svg"
          alt=""
          className="h-full w-full object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-paper via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-10 md:px-8">
          <div className="mx-auto max-w-6xl">
            <h1 className="font-serif text-4xl text-ink md:text-5xl">{`Om ${artistName}`}</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted md:text-base">
              {artistName} · malerier og smykker. Brug menuen nedenfor til at springe til biografi,
              portræt eller udvalgte udstillinger.
            </p>
          </div>
        </div>
      </header>

      <nav
        aria-label="På denne side"
        className="sticky top-14 z-30 border-b border-secondary/40 bg-paper/95 py-3 backdrop-blur-sm"
      >
        <div className="mx-auto flex max-w-6xl flex-wrap gap-2 px-5 md:gap-3 md:px-8">
          {quickNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full border border-secondary/50 bg-paper-warm/80 px-3 py-1.5 text-xs text-ink-muted transition hover:border-accent/40 hover:text-ink md:text-sm"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_300px] lg:items-start lg:gap-16">
          <section id="biografi" className="scroll-mt-32 lg:col-start-1 lg:row-start-1">
            <h2 className="font-serif text-2xl text-ink">Biografi</h2>
            <p className="section-rule mt-6 whitespace-pre-wrap text-lg leading-relaxed text-ink-muted">
              {about.biography}
            </p>
          </section>

          <aside
            id="portraet"
            className="scroll-mt-32 lg:sticky lg:top-28 lg:col-start-2 lg:row-span-2 lg:row-start-1"
          >
            <h2 className="mb-3 font-serif text-lg text-ink">Portræt</h2>
            <div className="border border-secondary/50 bg-paper-warm p-2 shadow-sm">
              <ArtworkImage
                src={about.artistPhoto}
                alt={`Portræt af ${artistName}`}
                className="w-full object-cover"
              />
            </div>
          </aside>

          <section id="udstillinger" className="scroll-mt-32 lg:col-start-1 lg:row-start-2">
            <h2 className="font-serif text-2xl text-ink">CV og udstillinger</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              Listen opdateres automatisk ud fra begivenheder, der er afsluttet (efter slutdato).
              Kommende udstillinger finder du under{" "}
              <Link href="/begivenheder" className="text-accent underline-offset-2 hover:underline">
                Begivenheder
              </Link>
              .
            </p>
            {pastExhibitions.length === 0 ? (
              <p className="mt-8 text-ink-muted">Ingen registrerede udstillinger i arkivet endnu.</p>
            ) : (
              <ul className="mt-10 space-y-4 border-l-2 border-secondary/60 pl-6">
                {pastExhibitions.map((e) => (
                  <li key={e.id} className="text-ink-muted">
                    <p className="leading-relaxed">{formatPastEventCvLine(e)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </article>
  );
}
