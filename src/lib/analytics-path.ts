/** Kun offentlige stier — ingen admin, API eller path traversal. */
export function isTrackablePublicPath(p: string): boolean {
  if (typeof p !== "string" || p.length === 0 || p.length > 200) return false;
  if (!p.startsWith("/")) return false;
  if (p.startsWith("/admin") || p.startsWith("/api") || p.startsWith("/_next")) return false;
  if (p.includes("..") || p.includes("//")) return false;
  return /^\/[\w./-]+$/i.test(p);
}
