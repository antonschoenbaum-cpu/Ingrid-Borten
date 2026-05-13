"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogIn } from "lucide-react";

type NavbarProps = {
  artistName: string;
};

const NAV_SPACER_CLASS = "h-[64px] md:h-[72px] lg:h-[88px]";

const NAV_ITEMS = [
  { href: "/", label: "Hjem" },
  { href: "/om", label: "Om" },
  { href: "/malerier", label: "Malerier" },
  { href: "/smykker", label: "Smykker" },
  { href: "/begivenheder", label: "Begivenheder" },
  { href: "/kontakt", label: "Kontakt" },
] as const;

function HamburgerIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      aria-hidden
    >
      <line x1="0" y1="7" x2="24" y2="7" />
      <line x1="0" y1="13" x2="24" y2="13" />
      <line x1="0" y1="19" x2="24" y2="19" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      aria-hidden
    >
      <line x1="4" y1="4" x2="20" y2="20" />
      <line x1="20" y1="4" x2="4" y2="20" />
    </svg>
  );
}

function isActiveHref(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar({ artistName }: NavbarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolledPastHero, setScrolledPastHero] = useState(false);

  const isHome = pathname === "/";

  useEffect(() => {
    if (!isHome) {
      const rafId = requestAnimationFrame(() => setScrolledPastHero(false));
      return () => cancelAnimationFrame(rafId);
    }
    function handleScroll() {
      const threshold = window.innerHeight * 0.85;
      setScrolledPastHero(window.scrollY > threshold);
    }
    const rafId = requestAnimationFrame(handleScroll);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [isHome]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const transparent = isHome && !scrolledPastHero && !open;

  const headerClass = [
    "fixed left-0 right-0 top-0 z-50 transition-all duration-300 ease-out",
    transparent
      ? "border-b border-transparent bg-transparent shadow-none"
      : "border-b border-gray-200/40 bg-paper shadow-sm",
  ].join(" ");

  const linkBase =
    "inline-block pb-1 text-sm font-light uppercase tracking-[0.18em] transition-opacity duration-200 hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current";

  const colorClass = transparent ? "text-white nav-text-shadow" : "text-ink";

  return (
    <>
      <header className={headerClass}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-8 md:py-5 lg:px-12 lg:py-6">
          <Link
            href="/"
            aria-label={`${artistName} — Til forsiden`}
            className={[
              "shrink-0 font-serif text-xl tracking-wide transition-opacity duration-200 hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current",
              colorClass,
            ].join(" ")}
          >
            {artistName}
          </Link>

          <nav
            className="hidden items-center md:flex md:gap-7 lg:gap-10"
            aria-label="Hovedmenu"
          >
            {NAV_ITEMS.map((item) => {
              const active = isActiveHref(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    linkBase,
                    colorClass,
                    active ? "border-b border-current" : "border-b border-transparent",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/login"
              aria-label="Log ind"
              title="Log ind"
              className={[
                "ml-2 inline-flex items-center justify-center transition-opacity duration-200 hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current lg:ml-6",
                colorClass,
              ].join(" ")}
            >
              <LogIn className="size-[1.15rem]" strokeWidth={1.5} />
            </Link>
          </nav>

          <button
            type="button"
            className={[
              "inline-flex items-center justify-center p-2 transition-opacity duration-200 hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current md:hidden",
              colorClass,
            ].join(" ")}
            aria-expanded={open}
            aria-controls="mobile-nav-overlay"
            aria-label={open ? "Luk menu" : "Åbn menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <HamburgerIcon />
          </button>
        </div>
      </header>

      <div
        id="mobile-nav-overlay"
        data-open={open ? "true" : "false"}
        aria-hidden={!open}
        className="fixed inset-0 z-[60] flex flex-col bg-white opacity-0 transition-opacity duration-300 ease-out data-[open=true]:pointer-events-auto data-[open=true]:opacity-100 data-[open=false]:pointer-events-none md:hidden"
      >
        <div className="flex items-center justify-between px-6 py-4">
          <span className="font-serif text-xl tracking-wide text-ink">{artistName}</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Luk menu"
            className="inline-flex items-center justify-center p-2 text-ink transition-opacity duration-200 hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
          >
            <CloseIcon />
          </button>
        </div>

        <nav
          className="flex flex-1 flex-col items-center justify-center gap-6 px-6 pb-16"
          aria-label="Mobilmenu"
        >
          {NAV_ITEMS.map((item, index) => {
            const active = isActiveHref(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
                style={{ transitionDelay: open ? `${index * 40}ms` : "0ms" }}
                className={[
                  "nav-overlay-item font-serif text-4xl text-ink transition-all duration-300 ease-out hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current",
                  active ? "border-b border-current pb-1" : "",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}

          <Link
            href="/login"
            onClick={() => setOpen(false)}
            style={{ transitionDelay: open ? `${NAV_ITEMS.length * 40}ms` : "0ms" }}
            className="nav-overlay-item mt-6 inline-flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-ink-muted transition-all duration-300 ease-out hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
          >
            <LogIn className="size-4" strokeWidth={1.5} />
            Log ind
          </Link>
        </nav>
      </div>

      {transparent ? null : <div aria-hidden className={NAV_SPACER_CLASS} />}
    </>
  );
}
