import Link from "next/link";

export type FooterProps = {
  artistName: string;
  atelierAddress: string;
  email: string;
  facebookUrl: string;
  instagramUrl: string;
};

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

export function Footer({
  artistName,
  atelierAddress,
  email,
  facebookUrl,
  instagramUrl,
}: FooterProps) {
  const year = new Date().getFullYear();
  const hasFacebook = facebookUrl.length > 0;
  const hasInstagram = instagramUrl.length > 0;

  return (
    <footer className="mt-auto border-t border-gray-200/50 bg-[#FAFAF7] py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="grid gap-12 md:grid-cols-3">
          <div>
            <p className="mb-3 font-heading text-xl text-gray-900">{artistName}</p>
            <p className="text-sm italic text-gray-600">Malerier · Smykker · Nordisk ro</p>
          </div>
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.2em] text-gray-500">Atelier</p>
            <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">
              {atelierAddress}
            </p>
            {email ? (
              <a
                href={`mailto:${email}`}
                className="mt-3 block text-sm text-gray-700 transition hover:opacity-60"
              >
                {email}
              </a>
            ) : null}
          </div>
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.2em] text-gray-500">Følg med</p>
            {hasFacebook || hasInstagram ? (
              <div className="flex gap-4">
                {hasFacebook ? (
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-700 transition hover:text-gray-900"
                    aria-label="Facebook"
                  >
                    <FacebookIcon className="h-5 w-5" />
                  </a>
                ) : null}
                {hasInstagram ? (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-700 transition hover:text-gray-900"
                    aria-label="Instagram"
                  >
                    <InstagramIcon className="h-5 w-5" />
                  </a>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Links tilføjes fra admin under Kontakt.</p>
            )}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-gray-200/50 pt-8 text-xs text-gray-500 md:flex-row md:items-center">
          <p>© {artistName} {year}</p>
          <Link
            href="/kontakt"
            className="text-xs uppercase tracking-[0.15em] text-gray-500 transition hover:text-gray-800"
          >
            Kontakt
          </Link>
        </div>
      </div>
    </footer>
  );
}
