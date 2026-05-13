"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogIn, Menu, X } from "lucide-react";

type NavbarProps = {
  artistName: string;
};

const NAV_HEIGHT_CLASS = "h-16";

function navLinkClass(active: boolean, transparent: boolean) {
  const base = "text-[13px] tracking-wide transition";
  if (transparent) {
    return [
      base,
      "nav-text-shadow",
      active ? "text-white" : "text-white/85 hover:text-white/70",
    ].join(" ");
  }
  return [
    base,
    "text-ink-muted hover:text-ink",
    active ? "!text-ink" : "",
  ].join(" ");
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

  const transparent = isHome && !scrolledPastHero && !open;

  const nav = [
    { href: "/", label: "Hjem" },
    { href: "/om", label: "Om" },
    { href: "/malerier", label: "Malerier" },
    { href: "/smykker", label: "Smykker" },
    { href: "/begivenheder", label: "Begivenheder" },
    { href: "/kontakt", label: "Kontakt" },
  ];

  const headerClass = [
    "fixed left-0 right-0 top-0 z-50 transition-all duration-300 ease-out",
    transparent
      ? "border-b border-transparent bg-transparent shadow-none"
      : "border-b border-secondary/40 bg-paper/95 shadow-sm",
  ].join(" ");

  const brandClass = [
    "shrink-0 font-serif text-[1.05rem] tracking-tight md:text-[1.15rem] transition-colors duration-300",
    transparent ? "text-white nav-text-shadow" : "text-ink",
  ].join(" ");

  const loginIconClass = [
    "flex items-center justify-center rounded p-2 transition",
    transparent
      ? "text-white nav-text-shadow hover:text-white/70"
      : "text-ink-muted hover:bg-linen/60 hover:text-ink",
  ].join(" ");

  const hamburgerClass = [
    "rounded p-2 md:hidden transition",
    transparent ? "text-white nav-text-shadow" : "text-ink",
  ].join(" ");

  return (
    <>
      <header className={headerClass}>
        <div className={`relative mx-auto flex ${NAV_HEIGHT_CLASS} max-w-6xl items-center gap-4 px-4 md:px-8`}>
          <Link href="/" className={brandClass}>
            {artistName}
          </Link>

          <nav
            className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-8 md:flex"
            aria-label="Hovedmenu"
          >
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={navLinkClass(pathname === item.href, transparent)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <Link
              href="/login"
              className={loginIconClass}
              aria-label="Log ind"
              title="Log ind"
            >
              <LogIn className="size-[1.15rem]" strokeWidth={1.5} />
            </Link>
            <button
              type="button"
              className={hamburgerClass}
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {open ? (
          <div
            id="mobile-nav"
            className="border-t border-secondary/40 bg-paper px-4 py-4 shadow-sm md:hidden"
          >
            <nav className="flex flex-col gap-3" aria-label="Mobilmenu">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "text-[13px] tracking-wide transition",
                    pathname === item.href ? "text-ink" : "text-ink-muted hover:text-ink",
                  ].join(" ")}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/login"
                className="text-[13px] text-ink-muted"
                onClick={() => setOpen(false)}
              >
                Log ind
              </Link>
            </nav>
          </div>
        ) : null}
      </header>

      {transparent ? null : <div aria-hidden className={NAV_HEIGHT_CLASS} />}
    </>
  );
}
