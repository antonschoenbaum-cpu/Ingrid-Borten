import { MetadataRoute } from "next";
import { getPaintings } from "@/lib/supabase-paintings";
import { getJewelry } from "@/lib/supabase-jewelry";
import { getEvents } from "@/lib/supabase-events";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ingrid-borten.vercel.app";

  const [paintings, jewelry, events] = await Promise.all([
    getPaintings().catch(() => []),
    getJewelry().catch(() => []),
    getEvents().catch(() => []),
  ]);

  const paintingUrls = paintings.map((p) => ({
    url: `${baseUrl}/malerier/${p.id}`,
    lastModified: new Date(p.createdAt),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const jewelryUrls = jewelry.map((j) => ({
    url: `${baseUrl}/smykker/${j.id}`,
    lastModified: new Date(j.createdAt),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const eventUrls = events.map((e) => ({
    url: `${baseUrl}/begivenheder`,
    lastModified: new Date(e.start_date),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/om`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/malerier`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/smykker`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/begivenheder`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/kontakt`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    ...paintingUrls,
    ...jewelryUrls,
    ...eventUrls,
  ];
}
