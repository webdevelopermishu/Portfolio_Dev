import type { Metadata } from "next";
import { absoluteUrl, siteUrl, stripHtml } from "@/lib/utils";
import type { ProjectDetail, SiteData } from "@/lib/services/content";

export function rootMetadata(data: SiteData): Metadata {
  const { settings, seo } = data;
  const favicon = settings.favicon?.url;
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: seo.title, template: seo.titleTemplate.includes("%s") ? seo.titleTemplate : "%s" },
    description: seo.description || undefined,
    applicationName: settings.siteName,
    authors: [{ name: settings.developerName }],
    icons: favicon ? { icon: favicon, shortcut: favicon, apple: favicon } : { icon: "/seed/favicon.svg" },
    formatDetection: { telephone: false },
  };
}

export function homeMetadata(data: SiteData): Metadata {
  const { settings, seo } = data;
  const canonical = seo.canonicalUrl ? absoluteUrl(seo.canonicalUrl) : siteUrl();
  const ogImage = seo.ogImage ?? settings.profileImage;
  const images = ogImage ? [{ url: absoluteUrl(ogImage.url), alt: ogImage.alt || settings.developerName }] : undefined;
  const title = seo.ogTitle || seo.title;
  const description = seo.ogDescription || seo.description || undefined;
  return {
    title: { absolute: seo.title },
    description: seo.description || undefined,
    alternates: { canonical },
    robots: { index: seo.robotsIndex, follow: seo.robotsFollow },
    openGraph: { type: "website", url: canonical, siteName: settings.siteName, title, description, images, locale: "en_US" },
    twitter: {
      card: seo.twitterCard === "summary" ? "summary" : "summary_large_image",
      title, description,
      images: images?.map((i) => i.url),
      site: seo.twitterHandle || undefined,
      creator: seo.twitterHandle || undefined,
    },
  };
}

export function projectMetadata(project: ProjectDetail, data: SiteData): Metadata {
  const { settings, seo } = data;
  const url = absoluteUrl(`/projects/${project.slug}`);
  const title = project.seoTitle || project.title;
  const description = project.seoDescription || project.shortDescription || stripHtml(project.description).slice(0, 160) || undefined;
  const image = project.ogImage ?? project.featuredImage;
  const images = image ? [{ url: absoluteUrl(image.url), alt: image.alt || project.title }] : undefined;
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: project.robotsIndex && seo.robotsIndex, follow: seo.robotsFollow },
    openGraph: { type: "article", url, siteName: settings.siteName, title, description, images },
    twitter: {
      card: seo.twitterCard === "summary" ? "summary" : "summary_large_image",
      title, description, images: images?.map((i) => i.url), site: seo.twitterHandle || undefined,
    },
  };
}
