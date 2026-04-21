import type { Metadata } from "next";
import { ArtworkImage } from "@/components/artwork-image";
import { formatEventDate, isEventPast } from "@/lib/format";
import { getEvents } from "@/lib/data";

export const metadata: Metadata = {
  title: "Begivenheder",
};

export default async function EventsPage() {
  const events = await getEvents();
  const upcoming = events
    .filter((e) => !isEventPast(e.date))
    .sort((a, b) => a.date.localeCompare(b.date));
  const past = events
    .filter((e) => isEventPast(e.date))
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-20">
      <header className="mb-14 max-w-2xl">
        <h1 className="font-serif text-4xl text-ink md:text-5xl">Begivenheder</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-muted">
          Udstillinger, markeder og åbne atelierdage. Kommende begivenheder vises først.
        </p>
      </header>

      <section className="mb-20">
        <h2 className="mb-8 font-serif text-2xl text-ink">Kommende</h2>
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
                  <p className="mt-2 text-sm uppercase tracking-widest text-sage-deep">
                    {formatEventDate(e.date)}
                  </p>
                  <p className="mt-1 text-ink-muted">{e.location}</p>
                  <p className="mt-4 leading-relaxed text-ink-muted">{e.description}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-8 font-serif text-2xl text-ink-muted">Tidligere</h2>
        <ul className="space-y-8">
          {past.map((e) => (
            <li
              key={e.id}
              className="flex flex-col gap-3 border-b border-ink/5 pb-8 opacity-75 last:border-0 md:flex-row md:gap-10"
            >
              {e.image ? (
                <ArtworkImage
                  src={e.image}
                  alt=""
                  className="h-28 w-40 shrink-0 object-cover grayscale md:h-24"
                />
              ) : null}
              <div>
                <h3 className="font-serif text-lg text-ink">{e.title}</h3>
                <p className="mt-1 text-xs uppercase tracking-widest text-ink-muted">
                  {formatEventDate(e.date)} · {e.location}
                </p>
                <p className="mt-2 text-sm text-ink-muted">{e.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
