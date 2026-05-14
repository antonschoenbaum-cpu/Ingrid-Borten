import type { Metadata } from "next";
import Link from "next/link";
import { ArtworkImage } from "@/components/artwork-image";
import { FadeInSection } from "@/components/fade-in-section";
import { OmSubnav } from "@/components/om-subnav";
import { isEventPastByEndDate } from "@/lib/format";
import { getAbout, getEvents } from "@/lib/data";
import { toMetaDescription } from "@/lib/seo";
import type { EventItem } from "@/types/content";

const artistName = (process.env.ARTIST_NAME ?? "Kunstnernavn").trim() || "Kunstnernavn";

function exhibitionParts(e: EventItem) {
  const end = e.end_date.slice(0, 10);
  const year = new Date(`${end}T12:00:00`).toLocaleDateString("sv-SE", {
    year: "numeric",
    timeZone: "Europe/Copenhagen",
  });
  return { year, title: e.title, venue: e.location };
}

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAbout();
  return {
    title: { absolute: `Om ${artistName}` },
    description: toMetaDescription(about.heroDescription, 160),
  };
}

export default async function OmPage() {
  const [about, events] = await Promise.all([getAbout(), getEvents()]);
  const portraitUrl = about.artistPhoto?.trim() ?? "";
  const hasPortrait = portraitUrl.length > 0;

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: artistName,
    description: about.biography,
    ...(hasPortrait ? { image: portraitUrl } : {}),
    jobTitle: "Kunstner",
  };

  const pastExhibitions = events
    .filter((e) => isEventPastByEndDate(e.end_date))
    .sort((a, b) => b.end_date.localeCompare(a.end_date));

  const quickNav = [
    { href: "#biografi", label: "Biografi" },
    ...(hasPortrait ? ([{ href: "#portraet", label: "Portræt" }] as const) : []),
    { href: "#udstillinger", label: "Udstillinger" },
  ] as const;

  const lead = `${artistName} · malerier og smykker. Brug menuen nedenfor til at springe til biografi${
    hasPortrait ? ", portræt" : ""
  } eller udvalgte udstillinger.`;

  return (
    <article className="text-gray-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />

      <div className="mx-auto max-w-6xl px-6 py-24 md:px-12">
        <FadeInSection>
          <p className="mb-4 text-xs uppercase tracking-[0.2em] text-gray-500">Om kunstneren</p>
          <h1 className="mb-6 font-heading text-5xl leading-[1.05] text-gray-900 md:text-7xl">
            {artistName}
          </h1>
          <p className="mb-16 max-w-2xl text-lg leading-relaxed text-gray-600 md:text-xl">{lead}</p>
        </FadeInSection>

        <div className="sticky top-[64px] z-30 border-b border-gray-200/50 bg-[color-mix(in_srgb,var(--bg-color,#F5F0EB)_92%,transparent)] py-4 backdrop-blur-sm md:top-[72px] lg:top-[88px]">
          <OmSubnav items={quickNav} />
        </div>

        <FadeInSection delay={0.05}>
          <section id="biografi" className="scroll-mt-36 py-16">
            {hasPortrait ? (
              <div className="grid gap-12 md:grid-cols-5 md:items-start md:gap-16">
                <div
                  id="portraet"
                  className="order-1 scroll-mt-36 md:order-2 md:col-span-2 md:col-start-4"
                >
                  <div className="overflow-hidden shadow-md" style={{ aspectRatio: "4 / 5" }}>
                    <ArtworkImage
                      src={portraitUrl}
                      alt={`Portræt af ${artistName}`}
                      className="h-full w-full object-cover"
                      priority
                    />
                  </div>
                </div>
                <div className="order-2 max-w-2xl space-y-6 font-body text-base leading-relaxed text-gray-800 md:order-1 md:col-span-3">
                  {about.heroDescription?.trim() ? (
                    <p className="whitespace-pre-wrap text-gray-800">{about.heroDescription}</p>
                  ) : null}
                  <p className="whitespace-pre-wrap text-gray-800">{about.biography}</p>
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl space-y-6 text-center font-body text-base leading-relaxed text-gray-800">
                {about.heroDescription?.trim() ? (
                  <p className="whitespace-pre-wrap text-gray-800">{about.heroDescription}</p>
                ) : null}
                <p className="whitespace-pre-wrap text-gray-800">{about.biography}</p>
              </div>
            )}
          </section>
        </FadeInSection>

        <FadeInSection delay={0.08}>
          <section id="udstillinger" className="scroll-mt-36 border-t border-gray-200/50 py-16">
            <h2 className="mb-6 font-heading text-3xl leading-tight text-gray-900 md:text-5xl">
              Udstillinger
            </h2>
            <p className="mb-10 max-w-2xl text-sm leading-relaxed text-gray-600">
              Listen opdateres automatisk ud fra begivenheder, der er afsluttet (efter slutdato).
              Kommende udstillinger finder du under{" "}
              <Link href="/begivenheder" className="text-gray-900 underline-offset-2 hover:underline">
                Begivenheder
              </Link>
              .
            </p>
            {pastExhibitions.length === 0 ? (
              <p className="text-gray-600">Ingen registrerede udstillinger i arkivet endnu.</p>
            ) : (
              <ul className="divide-y divide-gray-200/50">
                {pastExhibitions.map((e) => {
                  const { year, title, venue } = exhibitionParts(e);
                  return (
                    <li
                      key={e.id}
                      className="grid gap-4 py-4 md:grid-cols-[minmax(0,7rem)_1fr] md:items-baseline md:gap-10"
                    >
                      <p className="text-sm uppercase tracking-[0.18em] text-gray-500">{year}</p>
                      <div>
                        <p className="font-heading text-base text-gray-900">{title}</p>
                        <p className="mt-1 font-heading text-base text-gray-600">{venue}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </FadeInSection>
      </div>
    </article>
  );
}
