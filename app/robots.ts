import type { MetadataRoute } from "next";
import { getSiteData } from "@/lib/services/content";
import { siteUrl } from "@/lib/utils";

export const revalidate = 300;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { seo } = await getSiteData();
  const disallow = ["/admin", "/preview", "/api/"];
  return {
    rules: seo.robotsIndex ? [{ userAgent: "*", allow: "/", disallow }] : [{ userAgent: "*", disallow: "/" }],
    sitemap: `${siteUrl()}/sitemap.xml`,
    host: siteUrl(),
  };
}
