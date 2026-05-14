"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Item = { href: string; label: string };

export function OmSubnav({ items }: { items: readonly Item[] }) {
  const [hash, setHash] = useState("");

  useEffect(() => {
    const read = () => setHash(window.location.hash || "#biografi");
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  return (
    <nav aria-label="På denne side">
      <div className="flex flex-wrap gap-x-12 gap-y-4">
        {items.map((item) => {
          const isActive = hash === item.href || (hash === "" && item.href === "#biografi");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`pb-3 text-sm uppercase tracking-[0.18em] transition-colors ${
                isActive
                  ? "border-b-2 border-gray-900 text-gray-900"
                  : "border-b-2 border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
