"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogIn, Menu, X } from "lucide-react";

function navLinkClass(active: boolean) {
  return [
    "text-[13px] tracking-wide text-ink-muted transition hover:text-ink",
    active ? "!text-ink" : "",
  ].join(" ");
}

type NavbarProps = {
  artistName: string;
};

export function Navbar({ artistName }: NavbarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const nav = [
    { href: "/", label: "Hjem" },
    { href: "/om", label: `Om ${artistName}` },
    { href: "/malerier", label: "Malerier" },
    { href: "/smykker", label: "Smykker" },
    { href: "/begivenheder", label: "Begivenheder" },
    { href: "/kontakt", label: "Kontakt" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-secondary/40 bg-paper/95 backdrop-blur-sm">
      <div className="relative mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 md:px-8">
        <Link
          href="/"
          className="shrink-0 font-serif text-[1.05rem] tracking-tight text-ink md:text-[1.15rem]"
        >
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
              className={navLinkClass(pathname === item.href)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Link
            href="/login"
            className="flex items-center justify-center rounded p-2 text-ink-muted transition hover:bg-linen/60 hover:text-ink"
            aria-label="Log ind"
            title="Log ind"
          >
            <LogIn className="size-[1.15rem]" strokeWidth={1.5} />
          </Link>
          <button
            type="button"
            className="rounded p-2 text-ink md:hidden"
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
          className="border-t border-secondary/40 bg-paper px-4 py-4 md:hidden"
        >
          <nav className="flex flex-col gap-3" aria-label="Mobilmenu">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={navLinkClass(pathname === item.href)}
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
  );
}
