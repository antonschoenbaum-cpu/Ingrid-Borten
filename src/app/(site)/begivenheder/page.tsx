import type { Metadata } from "next";
import { ArtworkImage } from "@/components/artwork-image";
import {
  formatEventOpensDanish,
  formatEventUntilDanish,
  formatEventEndDateShort,
  isEventPastByEndDate,
} from "@/lib/format";
import { getEvents } from "@/lib/data";
const artistName = (process.env.ARTIST_NAME ?? "Kunstnernavn").trim() || "Kunstnernavn";

export const metadata: Metadata = {
  title: { absolute: `Begivenheder — ${artistName}` },
  description: "Kommende og tidligere udstillinger og begivenheder",
};

export default async function EventsPage() {
  const events = await getEvents();
  const upcoming = events
    .filter((e) => !isEventPastByEndDate(e.end_date))
    .sort((a, b) => a.start_date.localeCompare(b.start_date));
  const past = events
    .filter((e) => isEventPastByEndDate(e.end_date))
    .sort((a, b) => b.end_date.localeCompare(a.end_date));

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-20">
      <header className="mb-14 max-w-2xl">
        <h1 className="font-serif text-4xl text-ink md:text-5xl">Begivenheder</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-muted">
          Udstillinger, markeder og åbne atelierdage. Kommende og tidligere begivenheder sorteres
          automatisk ud fra slutdato.
        </p>
      </header>

      <section className="mb-20">
        <h2 className="mb-8 font-serif text-2xl text-ink">Kommende begivenheder</h2>
        {upcoming.length === 0 ? (
          <p className="text-ink-muted">Ingen kommende begivenheder registreret.</p>
        ) : (
          <ul className="space-y-12">
            {upcoming.map((e) => (
              <li
                key={e.id}
                className="grid gap-8 border-b border-ink/10 pb-12 last:border-0 md:grid-cols-[280px_1fr]"
              >
                {e.image ? (
                  <div className="overflow-hidden border border-ink/10 bg-paper-warm">
                    <ArtworkImage src={e.image} alt="" className="aspect-[4/3] w-full object-cover" />
                  </div>
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center border border-dashed border-ink/15 bg-linen/40 text-sm text-ink-muted">
                    Intet billede
                  </div>
                )}
                <div>
                  <h3 className="font-serif text-2xl text-ink">{e.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink">
                    {formatEventOpensDanish(e.start_date)}
                  </p>
                  <p className="mt-1 text-sm text-ink-muted">{formatEventUntilDanish(e.end_date)}</p>
                  <p className="mt-3 text-ink-muted">{e.location}</p>
                  <p className="mt-4 leading-relaxed text-ink-muted">{e.description}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-6 font-serif text-xl text-ink-muted/90 md:text-2xl">
          Tidligere begivenheder
        </h2>
        {past.length === 0 ? (
          <p className="text-sm text-ink-muted/80">Ingen tidligere begivenheder endnu.</p>
        ) : (
          <ul className="space-y-8">
            {past.map((e) => (
              <li
                key={e.id}
                className="flex flex-col gap-3 border-b border-ink/5 pb-8 text-sm text-ink-muted/85 last:border-0 md:flex-row md:gap-10 md:text-[0.9375rem]"
              >
                {e.image ? (
                  <ArtworkImage
                    src={e.image}
                    alt=""
                    className="h-24 w-36 shrink-0 object-cover opacity-80 grayscale md:h-20 md:w-32"
                  />
                ) : null}
                <div>
                  <h3 className="font-serif text-base text-ink-muted md:text-lg">{e.title}</h3>
                  <p className="mt-1 text-xs text-ink-muted/75">
                    {formatEventEndDateShort(e.end_date)} · {e.location}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-ink-muted/70 md:text-sm">
                    {e.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
