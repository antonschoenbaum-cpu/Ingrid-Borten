const FALLBACK_FROM = "SimplySell <no-reply@simplysell.dk>";

/** Afsender til Resend: kunstner + kontaktmail, ellers no-reply-domæne. */
export function resendFromHeader(): string {
  const artist = (process.env.ARTIST_NAME ?? "").trim();
  const contact = (process.env.CONTACT_EMAIL ?? "").trim();
  if (contact && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
    const name = artist || "Butik";
    return `${name} <${contact}>`;
  }
  return FALLBACK_FROM;
}
