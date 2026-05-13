import Link from "next/link";
import { ArtworkImage } from "@/components/artwork-image";
import { HeroBackground } from "@/components/HeroBackground";
import { SoldPrice } from "@/components/SoldPrice";
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

      <section className="border-y border-secondary/50 bg-paper-warm/80">
        <div className="mx-auto max-w-6xl px-5 pb-16 pt-24 md:px-8 md:pb-20 md:pt-32">
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <h2 className="font-serif text-3xl text-ink">Seneste malerier</h2>
            <Link
              href="/malerier"
              className="text-sm uppercase tracking-widest text-ink-muted underline-offset-4 transition hover:text-accent hover:underline"
            >
              Se alle malerier
            </Link>
          </div>
          {recentPaintings.length === 0 ? (
            <p className="text-ink-muted">Malerier tilføjes snart.</p>
          ) : (
            <div className="grid gap-8 sm:grid-cols-3">
              {recentPaintings.map((p) => (
                <Link key={p.id} href={`/malerier/${p.id}`} className="group block">
                  <div className="overflow-hidden border border-secondary/50 bg-paper transition duration-300 group-hover:border-accent/35 group-hover:shadow-md">
                    <ArtworkImage
                      src={p.image}
                      alt={p.title}
                      className="aspect-[4/5] w-full object-cover transition duration-500 ease-out group-hover:scale-[1.03]"
                    />
                    <div className="border-t border-secondary/40 px-4 py-4">
                      <h3 className="font-serif text-lg">{p.title}</h3>
                      <p className="mt-1">
                        <SoldPrice price={p.price} sold={p.sold} size="card" />
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-20">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <h2 className="font-serif text-3xl text-ink">Seneste smykker</h2>
          <Link
            href="/smykker"
            className="text-sm uppercase tracking-widest text-ink-muted underline-offset-4 transition hover:text-accent hover:underline"
          >
            Se alle smykker
          </Link>
        </div>
        {recentJewelry.length === 0 ? (
          <p className="text-ink-muted">Smykker tilføjes snart.</p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-3">
            {recentJewelry.map((j) => (
              <Link key={j.id} href={`/smykker/${j.id}`} className="group block">
                <div className="overflow-hidden border border-secondary/50 bg-paper transition duration-300 group-hover:border-accent/35 group-hover:shadow-md">
                  <ArtworkImage
                    src={j.image}
                    alt={j.title}
                    className="aspect-square w-full object-cover transition duration-500 ease-out group-hover:scale-[1.03]"
                  />
                  <div className="border-t border-secondary/40 px-4 py-4">
                    <h3 className="font-serif text-lg">{j.title}</h3>
                    <p className="mt-1">
                      <SoldPrice price={j.price} sold={j.sold} size="card" />
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="bg-linen/50">
        <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-20">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <h2 className="font-serif text-3xl text-ink">Kommende begivenheder</h2>
            <Link
              href="/begivenheder"
              className="text-sm uppercase tracking-widest text-ink-muted underline-offset-4 hover:text-ink hover:underline"
            >
              Alle begivenheder
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-ink-muted">Der er ingen kommende begivenheder lige nu.</p>
          ) : (
            <ul className="space-y-6">
              {upcoming.map((e) => (
                <li
                  key={e.id}
                  className="flex flex-col gap-2 border-b border-secondary/40 pb-6 last:border-0 md:flex-row md:items-start md:justify-between md:gap-10"
                >
                  <div className="min-w-0 shrink-0 md:max-w-md">
                    <h3 className="font-serif text-xl text-ink">{e.title}</h3>
                    <p className="mt-2 text-sm text-ink">{formatEventOpensDanish(e.start_date)}</p>
                    <p className="mt-0.5 text-sm text-ink-muted">{formatEventUntilDanish(e.end_date)}</p>
                    <p className="mt-2 text-sm text-ink-muted">{e.location}</p>
                  </div>
                  <p className="min-w-0 flex-1 text-sm leading-relaxed text-ink-muted">
                    {e.description}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
