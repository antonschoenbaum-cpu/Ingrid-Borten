/** Normaliser valgfri http(s)-URL; tom streng tilladt. */
export function normalizeOptionalHttpUrl(input: string): string {
  const t = input.trim();
  if (!t) return "";
  const withScheme = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      throw new Error("invalid protocol");
    }
  } catch {
    throw new Error("INVALID_URL");
  }
  return withScheme;
}
