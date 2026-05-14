import type { Metadata } from "next";
import Link from "next/link";
import { ArtworkImage } from "@/components/artwork-image";
import { FadeInSection } from "@/components/fade-in-section";
import { SitePageHeader } from "@/components/site-page-header";
import {
  formatEventOpensDanish,
  formatEventUntilDanish,
  formatEventEndDateShort,
  isEventPastByEndDate,
} from "@/lib/format";
import { canUseSupabaseContactRead, readContactFromSupabase } from "@/lib/supabase-contact";
import { getEvents } from "@/lib/data";

const artistName = (process.env.ARTIST_NAME ?? "Kunstnernavn").trim() || "Kunstnernavn";

export const metadata: Metadata = {
  title: { absolute: `Begivenheder — ${artistName}` },
  description: "Kommende og tidligere udstillinger og begivenheder",
};

export default async function EventsPage() {
  const events = await getEvents();
  let instagramUrl = "";
  if (canUseSupabaseContactRead()) {
    try {
      const row = await readContactFromSupabase();
      if (row?.instagramUrl?.trim()) instagramUrl = row.instagramUrl.trim();
    } catch {
      // ignore
    }
  }

  const upcoming = events
    .filter((e) => !isEventPastByEndDate(e.end_date))
    .sort((a, b) => a.start_date.localeCompare(b.start_date));
  const past = events
    .filter((e) => isEventPastByEndDate(e.end_date))
    .sort((a, b) => b.end_date.localeCompare(a.end_date));

  const subtitle =
    "Udstillinger, markeder og åbne atelierdage. Kommende og tidligere begivenheder sorteres automatisk ud fra slutdato.";

  return (
    <div>
      <FadeInSection>
        <SitePageHeader eyebrow="Kalender" title="Begivenheder" subtitle={subtitle} />
      </FadeInSection>

      <div className="mx-auto max-w-7xl px-6 pb-24 md:px-12 md:pb-32">
        <FadeInSection delay={0.05}>
          <section className="mb-20">
            <h2 className="mb-8 font-heading text-3xl leading-tight text-gray-900 md:text-5xl">
              Kommende begivenheder
            </h2>
            {upcoming.length === 0 ? (
              <p className="max-w-md text-base italic leading-relaxed text-gray-600">
                Næste udstilling annonceres snart. Følg med på{" "}
                {instagramUrl ? (
                  <Link
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-900 underline-offset-2 hover:underline"
                  >
                    Instagram
                  </Link>
                ) : (
                  "Instagram"
                )}{" "}
                for opdateringer.
              </p>
            ) : (
              <ul className="space-y-12">
                {upcoming.map((e) => (
                  <li
                    key={e.id}
                    className="grid gap-8 border-b border-gray-200/50 pb-12 last:border-0 md:grid-cols-[280px_1fr]"
                  >
                    {e.image ? (
                      <div className="overflow-hidden border border-gray-200/50 bg-paper-warm">
                        <ArtworkImage
                          src={e.image}
                          alt=""
                          className="aspect-[4/3] w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-[4/3] items-center justify-center border border-dashed border-gray-200/80 bg-[#FAFAF7] text-sm text-gray-500">
                        Intet billede
                      </div>
                    )}
                    <div>
                      <h3 className="font-heading text-2xl text-gray-900">{e.title}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-gray-900">
                        {formatEventOpensDanish(e.start_date)}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">{formatEventUntilDanish(e.end_date)}</p>
                      <p className="mt-3 text-gray-600">{e.location}</p>
                      <p className="mt-4 leading-relaxed text-gray-600">{e.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </FadeInSection>

        {past.length > 0 ? (
          <section>
            <h2 className="mb-6 font-heading text-2xl text-gray-600 md:text-3xl">
              Tidligere begivenheder
            </h2>
            <ul className="space-y-8">
              {past.map((e) => (
                <li
                  key={e.id}
                  className="flex flex-col gap-3 border-b border-gray-200/50 pb-8 text-sm text-gray-600 last:border-0 md:flex-row md:gap-10 md:text-[0.9375rem]"
                >
                  {e.image ? (
                    <ArtworkImage
                      src={e.image}
                      alt=""
                      className="h-24 w-36 shrink-0 object-cover opacity-90 md:h-20 md:w-32"
                    />
                  ) : null}
                  <div>
                    <h3 className="font-heading text-base text-gray-700 md:text-lg">{e.title}</h3>
                    <p className="mt-1 text-xs text-gray-500">
                      {formatEventEndDateShort(e.end_date)} · {e.location}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-gray-600 md:text-sm">
                      {e.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
