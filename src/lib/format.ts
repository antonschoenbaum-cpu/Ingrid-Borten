import type { EventItem } from "@/types/content";

export function formatPriceDKK(amount: number): string {
  return `${amount.toLocaleString("da-DK")} kr.`;
}

/** I dag som YYYY-MM-DD (København) til sammenligning med end_date. */
export function todayDateStringCopenhagen(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Copenhagen" });
}

/** Begivenhed er tidligere når slutdato (dato) er før i dag (kun dato, ikke klokkeslæt). */
export function isEventPastByEndDate(endDateYmd: string): boolean {
  const end = endDateYmd.slice(0, 10);
  return end < todayDateStringCopenhagen();
}

function capitalizeFirstDa(s: string): string {
  if (!s) return s;
  return s.charAt(0).toLocaleUpperCase("da-DK") + s.slice(1);
}

function parseEventStart(start: string): Date {
  const s = start.trim();
  if (s.includes("T")) return new Date(s);
  return new Date(`${s.slice(0, 10)}T12:00:00`);
}

/** Fx «Åbner lørdag d. 14. juni 2025 kl. 18.00» */
export function formatEventOpensDanish(startDateTime: string): string {
  const d = parseEventStart(startDateTime);
  const weekday = capitalizeFirstDa(
    d.toLocaleDateString("da-DK", { weekday: "long", timeZone: "Europe/Copenhagen" }),
  );
  const datePart = d.toLocaleDateString("da-DK", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Copenhagen",
  });
  const timePart = d.toLocaleTimeString("da-DK", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Copenhagen",
  });
  return `Åbner ${weekday} d. ${datePart} kl. ${timePart}`;
}

/** Fx «Frem til 20. juni 2025» */
export function formatEventUntilDanish(endDateYmd: string): string {
  const end = endDateYmd.slice(0, 10);
  const d = new Date(`${end}T12:00:00`);
  const datePart = d.toLocaleDateString("da-DK", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Copenhagen",
  });
  return `Frem til ${datePart}`;
}

/** Kort dato til tidligere begivenheder (liste). */
export function formatEventEndDateShort(endDateYmd: string): string {
  const end = endDateYmd.slice(0, 10);
  const d = new Date(`${end}T12:00:00`);
  return d.toLocaleDateString("da-DK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Copenhagen",
  });
}

/** CV-linje fra afsluttet begivenhed: «2024 — Titel, Sted» */
export function formatPastEventCvLine(e: EventItem): string {
  const end = e.end_date.slice(0, 10);
  const y = new Date(`${end}T12:00:00`).toLocaleDateString("sv-SE", {
    year: "numeric",
    timeZone: "Europe/Copenhagen",
  });
  return `${y} — ${e.title}, ${e.location}`;
}
