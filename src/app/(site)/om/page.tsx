import type { Metadata } from "next";
import { ArtworkImage } from "@/components/artwork-image";
import { getAbout } from "@/lib/data";

export const metadata: Metadata = {
  title: "Om",
};

export default async function OmPage() {
  const about = await getAbout();

  return (
    <article>
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
            <h1 className="font-serif text-4xl text-ink md:text-5xl">Om kunstneren</h1>
            <p className="mt-2 text-sm uppercase tracking-[0.2em] text-ink-muted">
              Ingrid Simmenæs Borten · Malerier · Smykker
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:grid-cols-[1fr_280px] md:gap-16 md:px-8 md:py-24">
        <div>
          <h2 className="font-serif text-2xl text-ink">Biografi</h2>
          <p className="section-rule mt-6 whitespace-pre-wrap text-lg leading-relaxed text-ink-muted">
            {about.biography}
          </p>

          <section className="section-rule mt-16 pt-16">
            <h2 className="font-serif text-2xl text-ink">CV og udstillinger</h2>
            <ul className="mt-8 space-y-6">
              {about.cvEntries.map((entry) => (
                <li key={entry.id} className="flex gap-6 border-l-2 border-secondary pl-6">
                  <span className="shrink-0 font-serif text-xl text-accent">{entry.year}</span>
                  <p className="leading-relaxed text-ink-muted">{entry.text}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="md:pt-2">
          <div className="border border-secondary/50 bg-paper-warm p-2">
            <ArtworkImage
              src={about.artistPhoto}
              alt="Portræt af Ingrid Simmenæs Borten"
              className="w-full object-cover"
            />
          </div>
        </aside>
      </div>
    </article>
  );
}
