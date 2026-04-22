import Link from "next/link";
import { AdminAnalyticsSummary } from "./admin-analytics-summary";
import { UploadWidget } from "./upload-widget";

const cards = [
  {
    href: "/admin/malerier",
    title: "Malerier",
    text: "Tilføj, rediger og slet malerier og billeder.",
  },
  {
    href: "/admin/smykker",
    title: "Smykker",
    text: "Administrer smykker og upload til jewelry-mappen.",
  },
  {
    href: "/admin/begivenheder",
    title: "Begivenheder",
    text: "Kommende og tidligere begivenheder med valgfrit billede.",
  },
  {
    href: "/admin/om",
    title: "Om kunstneren",
    text: "Biografi og portrætfoto; udstillinger hentes fra begivenheder.",
  },
  {
    href: "/admin/kontakt",
    title: "Sociale medier",
    text: "Facebook- og Instagram-links på kontaktsiden.",
  },
];

export default async function AdminHomePage() {
  return (
    <div>
      <h1 className="font-serif text-3xl text-ink">Administration</h1>
      <p className="mt-3 max-w-xl text-sm text-ink-muted">
        Alt indhold gemmes i JSON-filer under <code className="text-xs">data/</code> og
        vises straks på den offentlige side efter gem.
      </p>

      <AdminAnalyticsSummary />

      <ul className="mt-12 grid gap-6 sm:grid-cols-2">
        {cards.map((c) => (
          <li key={c.href}>
            <Link
              href={c.href}
              className="block h-full border border-secondary/50 bg-paper-warm/40 p-6 transition hover:border-accent/40 hover:shadow-sm"
            >
              <h2 className="font-serif text-xl text-ink">{c.title}</h2>
              <p className="mt-2 text-sm text-ink-muted">{c.text}</p>
              <span className="btn-outline mt-4 inline-flex text-[11px]">Åbn</span>
            </Link>
          </li>
        ))}
      </ul>

      <section className="section-rule mt-16 border-dashed pt-16">
        <h2 className="font-serif text-xl text-ink">Hurtig upload</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Vælg mappe og fil. Stien vises efter upload — indsæt den i maleri-, smykke- eller
          begivenhedsformularen, eller under Om kunstneren.
        </p>
        <UploadWidget />
      </section>
    </div>
  );
}
