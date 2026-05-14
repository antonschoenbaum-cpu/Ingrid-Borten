import Link from "next/link";
import { FadeInSection } from "@/components/fade-in-section";
import { FeaturedWork } from "@/components/featured-work";
import { GalleryGrid } from "@/components/GalleryGrid";
import { HeroBackground } from "@/components/HeroBackground";
import {
  formatEventOpensDanish,
  formatEventUntilDanish,
  isEventPastByEndDate,
} from "@/lib/format";
import { getAbout, getEvents, getJewelry, getPaintings } from "@/lib/data";

export default async function HomePage() {
  const [paintings, jewelry, events, about] = await Promise.all([
    getPaintings(),
    getJewelry(),
    getEvents(),
    getAbout(),
  ]);

  const recentPaintings = [...paintings]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3);
  const recentJewelry = [...jewelry]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3);

  const featuredPainting =
    [...paintings].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;

  const upcoming = events
    .filter((e) => !isEventPastByEndDate(e.end_date))
    .sort((a, b) => a.start_date.localeCompare(b.start_date))
    .slice(0, 2);

  const heroImages = [
    about.heroImage1,
    about.heroImage2,
    about.heroImage3,
    about.heroImage4,
    about.heroImage5,
  ]
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter((v) => v.length > 0);

  const heroTitle =
    about.heroTitle?.trim() ||
    "Penselstrøg og metal formet i takt med naturens stille fortællinger.";
  const heroSubtitle =
    about.heroSubtitle?.trim() ||
    "Velkommen til et rum for maleri og smykker — håndværk med ro, varme og nordisk landskab i mindet.";

  return (
    <div>
      <section className="relative min-h-[85vh] w-full overflow-hidden bg-paper-warm md:min-h-screen">
        {heroImages.length > 0 ? <HeroBackground images={heroImages} /> : null}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-[60%]"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.45) 30%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0) 100%)",
          }}
        />
        <div className="relative mx-auto flex min-h-[85vh] max-w-7xl flex-col justify-end px-6 pb-16 pt-12 md:min-h-screen md:px-12 md:pb-24 md:pt-32">
          <h1 className="max-w-[20ch] font-serif text-4xl font-normal leading-[1.1] text-white md:text-5xl lg:text-6xl">
            {heroTitle}
          </h1>
          <p className="mt-6 max-w-[55ch] text-base leading-relaxed text-white/85 md:text-lg">
            {heroSubtitle}
          </p>
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-white/60"
        >
          <span className="text-[0.65rem] uppercase tracking-[0.3em]">Scroll</span>
          <span className="hero-scroll-dot block size-1.5 rounded-full bg-white/70" />
        </div>
      </section>

      <FadeInSection>
        <FeaturedWork painting={featuredPainting} />
      </FadeInSection>

      <section className="border-y border-gray-200/50 bg-paper-warm/80 py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          <FadeInSection delay={0.04}>
            <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <h2 className="font-heading text-4xl leading-tight text-gray-900 md:text-5xl">
                Seneste malerier
              </h2>
              <Link
                href="/malerier"
                className="text-sm uppercase tracking-[0.18em] text-gray-600 underline-offset-4 transition hover:text-gray-900 hover:underline"
              >
                Se alle malerier
              </Link>
            </div>
            {recentPaintings.length === 0 ? (
              <p className="py-24 text-center text-base italic text-gray-500">
                Værker tilføjes løbende. Vend tilbage snart.
              </p>
            ) : (
              <GalleryGrid items={recentPaintings} basePath="/malerier" />
            )}
          </FadeInSection>
        </div>
      </section>

      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          <FadeInSection delay={0.06}>
            <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <h2 className="font-heading text-4xl leading-tight text-gray-900 md:text-5xl">
                Seneste smykker
              </h2>
              <Link
                href="/smykker"
                className="text-sm uppercase tracking-[0.18em] text-gray-600 underline-offset-4 transition hover:text-gray-900 hover:underline"
              >
                Se alle smykker
              </Link>
            </div>
            {recentJewelry.length === 0 ? (
              <p className="py-24 text-center text-base italic text-gray-500">
                Værker tilføjes løbende. Vend tilbage snart.
              </p>
            ) : (
              <GalleryGrid items={recentJewelry} basePath="/smykker" />
            )}
          </FadeInSection>
        </div>
      </section>

      {upcoming.length > 0 ? (
        <section className="border-t border-gray-200/50 bg-linen/50 py-24 md:py-32">
          <div className="mx-auto max-w-7xl px-6 md:px-12">
            <FadeInSection delay={0.08}>
              <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <h2 className="font-heading text-4xl leading-tight text-gray-900 md:text-5xl">
                  Kommende begivenheder
                </h2>
                <Link
                  href="/begivenheder"
                  className="text-sm uppercase tracking-[0.18em] text-gray-600 underline-offset-4 transition hover:text-gray-900 hover:underline"
                >
                  Alle begivenheder
                </Link>
              </div>
              <ul className="space-y-6">
                {upcoming.map((e) => (
                  <li
                    key={e.id}
                    className="flex flex-col gap-2 border-b border-gray-200/50 pb-6 last:border-0 md:flex-row md:items-start md:justify-between md:gap-10"
                  >
                    <div className="min-w-0 shrink-0 md:max-w-md">
                      <h3 className="font-heading text-xl text-gray-900">{e.title}</h3>
                      <p className="mt-2 text-sm text-gray-900">
                        {formatEventOpensDanish(e.start_date)}
                      </p>
                      <p className="mt-0.5 text-sm text-gray-600">
                        {formatEventUntilDanish(e.end_date)}
                      </p>
                      <p className="mt-2 text-sm text-gray-600">{e.location}</p>
                    </div>
                    <p className="min-w-0 flex-1 text-sm leading-relaxed text-gray-600">
                      {e.description}
                    </p>
                  </li>
                ))}
              </ul>
            </FadeInSection>
          </div>
        </section>
      ) : null}
    </div>
  );
}
