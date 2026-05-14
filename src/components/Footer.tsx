import Link from "next/link";
import { FacebookIcon, InstagramIcon } from "@/components/social-icons";

export type FooterProps = {
  artistName: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  facebookUrl: string;
  instagramUrl: string;
};

export function Footer({
  artistName,
  email,
  addressLine1,
  addressLine2,
  facebookUrl,
  instagramUrl,
}: FooterProps) {
  const year = new Date().getFullYear();
  const hasFacebook = facebookUrl.length > 0;
  const hasInstagram = instagramUrl.length > 0;
  const showSocialColumn = hasFacebook || hasInstagram;
  const hasEmail = email.trim().length > 0;

  const gridClass = showSocialColumn ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2";

  return (
    <footer className="mt-auto border-t border-gray-200/50 bg-[#FAFAF7]">
      <div className="mx-auto max-w-7xl px-6 py-16 md:px-12 md:py-20">
        <div className={`grid gap-12 ${gridClass}`}>
          <div>
            <p className="mb-3 font-heading text-xl text-gray-900">{artistName}</p>
            <p className="text-sm italic text-gray-600">Malerier · Smykker · Nordisk ro</p>
          </div>

          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.2em] text-gray-500">Kontakt</p>
            {hasEmail ? (
              <p className="mb-3">
                <a
                  href={`mailto:${email.trim()}`}
                  className="text-sm text-gray-700 transition hover:text-gray-900"
                >
                  {email.trim()}
                </a>
              </p>
            ) : null}
            <p className="mb-3 text-sm leading-relaxed text-gray-700">{addressLine1}</p>
            <p className="text-sm leading-relaxed text-gray-700">{addressLine2}</p>
          </div>

          {showSocialColumn ? (
            <div>
              <p className="mb-4 text-xs uppercase tracking-[0.2em] text-gray-500">Følg med</p>
              <div className="flex flex-wrap gap-4">
                {hasFacebook ? (
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-700 transition hover:text-gray-900"
                    aria-label="Facebook"
                  >
                    <FacebookIcon className="h-6 w-6 fill-current" />
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
                    <InstagramIcon className="h-6 w-6 fill-current" />
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-gray-200/50 pt-8 sm:flex-row sm:items-center">
          <p className="text-xs text-gray-500">
            © {artistName} {year}
          </p>
          <Link
            href="/kontakt"
            className="text-xs uppercase tracking-[0.15em] text-gray-500 transition hover:text-gray-700"
          >
            Kontakt
          </Link>
        </div>
      </div>
    </footer>
  );
}
