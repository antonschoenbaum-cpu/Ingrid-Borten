import type { Painting } from "@/types/content";

/** Op til tre unikke id'er i rækkefølge (CMS / API). */
export function normalizeFeaturedPaintingIds(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const x of v) {
    if (typeof x !== "string") continue;
    const id = x.trim();
    if (!id || out.includes(id)) continue;
    out.push(id);
    if (out.length >= 3) break;
  }
  return out;
}

/** Løser CMS-id'er til malerier i samme rækkefølge; springer slettede id'er over. */
export function resolveFeaturedPaintings(ids: string[] | undefined, paintings: Painting[]): Painting[] {
  if (!ids?.length) return [];
  const map = new Map(paintings.map((p) => [p.id, p]));
  const out: Painting[] = [];
  for (const id of ids) {
    const p = map.get(id);
    if (p) out.push(p);
  }
  return out;
}
