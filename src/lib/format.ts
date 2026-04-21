export function formatPriceDKK(amount: number): string {
  return `${amount.toLocaleString("da-DK")} kr.`;
}

export function formatEventDate(isoDate: string): string {
  const d = new Date(isoDate + (isoDate.length <= 10 ? "T12:00:00" : ""));
  return d.toLocaleDateString("da-DK", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function isEventPast(isoDate: string): boolean {
  const end = new Date(isoDate + (isoDate.length <= 10 ? "T23:59:59" : ""));
  return end < new Date();
}
