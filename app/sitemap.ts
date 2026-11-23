import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { getSiteData, livePublished } from "@/lib/services/content";
import { absoluteUrl, siteUrl } from "@/lib/utils";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { seo, settings } = await getSiteData();
  if (!seo.robotsIndex) return [];
  const projects = await db.project.findMany({
    where: { ...livePublished(), includeInSitemap: true, robotsIndex: true },
    select: { slug: true, updatedAt: true },
    orderBy: { order: "asc" },
  });
  const latest = projects.reduce((max, p) => (p.updatedAt > max ? p.updatedAt : max), settings.updatedAt);
  return [
    ...(seo.includeInSitemap ? [{ url: siteUrl(), lastModified: latest, changeFrequency: "monthly" as const, priority: 1 }] : []),
    ...(projects.length ? [{ url: absoluteUrl("/projects"), lastModified: latest, changeFrequency: "monthly" as const, priority: 0.8 }] : []),
    ...projects.map((p) => ({ url: absoluteUrl(`/projects/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "yearly" as const, priority: 0.7 })),
  ];
}
