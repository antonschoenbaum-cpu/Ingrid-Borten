"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  CalendarDays,
  Gem,
  Home,
  ImageIcon,
  Palette,
  Settings,
  UserRound,
} from "lucide-react";

const links = [
  { href: "/admin", label: "Oversigt", icon: Home },
  { href: "/admin/malerier", label: "Malerier", icon: Palette },
  { href: "/admin/smykker", label: "Smykker", icon: Gem },
  { href: "/admin/begivenheder", label: "Begivenheder", icon: CalendarDays },
  { href: "/admin/om", label: "Om kunstneren", icon: UserRound },
  { href: "/admin/kontakt", label: "Sociale medier", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-secondary/40 bg-paper md:w-56 md:border-b-0 md:border-r">
      <div className="flex items-center gap-2 px-4 py-5 md:border-b md:border-secondary/40">
        <ImageIcon className="size-4 text-accent" strokeWidth={1.5} />
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-ink-muted">
          Admin
        </span>
      </div>
      <nav className="flex flex-row flex-wrap gap-1 px-2 py-2 md:flex-col md:gap-0 md:px-2 md:py-4">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={[
                "flex items-center gap-2 rounded px-3 py-2 text-sm transition",
                active
                  ? "bg-linen/80 text-ink"
                  : "text-ink-muted hover:bg-linen/50 hover:text-ink",
              ].join(" ")}
            >
              <Icon className="size-4 shrink-0 opacity-70" strokeWidth={1.5} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto hidden flex-col gap-2 border-t border-secondary/40 p-4 md:flex">
        <Link href="/" className="text-sm text-ink-muted hover:text-ink">
          Til forsiden
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-left text-sm text-ink-muted underline-offset-2 hover:text-ink hover:underline"
        >
          Log ud
        </button>
      </div>
    </aside>
  );
}
