import Link from "next/link";

type FooterProps = {
  artistName: string;
};

export function Footer({ artistName }: FooterProps) {
  const year = new Date().getFullYear();
  return (
    <footer className="section-rule mt-auto bg-paper">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-10 text-sm text-ink-muted md:flex-row md:px-8">
        <p>© {artistName} {year}</p>
        <p className="font-serif text-[0.95rem] text-ink/70">Malerier · Smykker · Nordisk ro</p>
        <Link
          href="/kontakt"
          className="underline-offset-4 transition hover:text-ink hover:underline"
        >
          Kontakt
        </Link>
      </div>
    </footer>
  );
}
