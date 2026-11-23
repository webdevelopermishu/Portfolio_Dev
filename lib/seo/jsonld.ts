import { absoluteUrl, siteUrl, stripHtml } from "@/lib/utils";
import type { ProjectDetail, SiteData } from "@/lib/services/content";

type Json = Record<string, unknown>;

/** Drops empty values so the structured data only states what has actually been entered. */
function compact(obj: Json): Json {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0)),
  );
}

const personId = () => `${siteUrl()}/#person`;
const websiteId = () => `${siteUrl()}/#website`;

export function personSchema(data: SiteData): Json {
  const { settings, socials, skills } = data;
  return compact({
    "@type": "Person",
    "@id": personId(),
    name: settings.developerName,
    jobTitle: settings.professionalTitle,
    url: siteUrl(),
    image: settings.profileImage ? absoluteUrl(settings.profileImage.url) : undefined,
    email: settings.email ? `mailto:${settings.email}` : undefined,
    address: settings.location ? { "@type": "PostalAddress", addressLocality: settings.location } : undefined,
    sameAs: socials.map((s) => s.url).filter((u) => /^https?:\/\//.test(u)),
    knowsAbout: skills.map((s) => s.label),
  });
}

export function homeGraph(data: SiteData) {
  const { settings, seo } = data;
  const graph: Json[] = [
    personSchema(data),
    compact({
      "@type": "WebSite",
      "@id": websiteId(),
      url: siteUrl(),
      name: settings.siteName,
      description: seo.description,
      publisher: { "@id": personId() },
      inLanguage: "en",
    }),
    compact({
      "@type": "WebPage",
      "@id": `${siteUrl()}/#webpage`,
      url: siteUrl(),
      name: seo.title,
      description: seo.description,
      isPartOf: { "@id": websiteId() },
      about: { "@id": personId() },
      inLanguage: "en",
    }),
  ];
  if (seo.schemaType === "ProfessionalService") {
    graph.push(
      compact({
        "@type": "ProfessionalService",
        "@id": `${siteUrl()}/#service`,
        name: settings.siteName,
        url: siteUrl(),
        description: seo.description,
        image: settings.profileImage ? absoluteUrl(settings.profileImage.url) : undefined,
        email: settings.email || undefined,
        telephone: settings.phone || undefined,
        address: settings.location ? { "@type": "PostalAddress", addressLocality: settings.location } : undefined,
        founder: { "@id": personId() },
      }),
    );
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

export function projectGraph(project: ProjectDetail, data: SiteData) {
  const url = absoluteUrl(`/projects/${project.slug}`);
  const image = project.featuredImage ? absoluteUrl(project.featuredImage.url) : undefined;
  return {
    "@context": "https://schema.org",
    "@graph": [
      compact({
        "@type": "CreativeWork",
        "@id": `${url}#work`,
        name: project.title,
        headline: project.title,
        description: project.shortDescription || stripHtml(project.description).slice(0, 300),
        url,
        image,
        genre: project.category,
        keywords: project.technologies.join(", "),
        dateCreated: project.completedAt ? project.completedAt.toISOString().slice(0, 10) : undefined,
        dateModified: project.updatedAt.toISOString(),
        creator: { "@type": "Person", "@id": personId(), name: data.settings.developerName, url: siteUrl() },
        sameAs: [project.projectUrl, project.githubUrl].filter((u) => /^https?:\/\//.test(u)),
      }),
      breadcrumbSchema([
        { name: "Home", url: siteUrl() },
        { name: "Projects", url: absoluteUrl("/projects") },
        { name: project.title, url },
      ]),
    ],
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]): Json {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, item: item.url })),
  };
}
