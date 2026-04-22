import Link from "next/link";
import { ArtworkImage } from "@/components/artwork-image";
import { SoldPrice } from "@/components/SoldPrice";
import {
  formatEventOpensDanish,
  formatEventUntilDanish,
  isEventPastByEndDate,
} from "@/lib/format";
import { getEvents, getJewelry, getPaintings } from "@/lib/data";

export default async function HomePage() {
  const [paintings, jewelry, events] = await Promise.all([
    getPaintings(),
    getJewelry(),
    getEvents(),
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

  return (
    <div>
      <section className="relative min-h-[72vh] w-full">
        <ArtworkImage
          src="/uploads/hero-home.svg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-paper via-paper/40 to-transparent" />
        <div className="relative mx-auto flex min-h-[72vh] max-w-6xl flex-col justify-end px-5 pb-16 pt-32 md:px-8 md:pb-24">
          <p className="max-w-xl font-serif text-3xl leading-tight text-ink md:text-4xl lg:text-[2.75rem]">
            Penselstrøg og metal formet i takt med naturens stille fortællinger.
          </p>
          <p className="mt-6 max-w-lg text-lg text-ink-muted">
            Velkommen til et rum for maleri og smykker — håndværk med ro, varme og
            nordisk landskab i mindet.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
        <p className="mx-auto max-w-3xl text-center text-lg leading-relaxed text-ink-muted">
          Ingrid Simmenæs Borten arbejder på grænsen mellem maleri og skulptur — fra
          olie på lærred til øreringe formet som små arkitektoniske former. Her møder
          du udvalgte værker og begivenheder.
        </p>
      </section>

      <section className="border-y border-secondary/50 bg-paper-warm/80">
        <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-20">
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <h2 className="font-serif text-3xl text-ink">Seneste malerier</h2>
            <Link
              href="/malerier"
              className="text-sm uppercase tracking-widest text-ink-muted underline-offset-4 transition hover:text-accent hover:underline"
            >
              Se alle malerier
            </Link>
          </div>
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
