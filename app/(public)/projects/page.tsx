import type { Metadata } from "next";
import Link from "next/link";
import { ProjectCard } from "@/components/public/Projects";
import { Reveal } from "@/components/public/motion";
import { JsonLd } from "@/components/shared/JsonLd";
import { getAllProjects, getSiteData } from "@/lib/services/content";
import { breadcrumbSchema } from "@/lib/seo/jsonld";
import { absoluteUrl, siteUrl } from "@/lib/utils";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const { settings, seo } = await getSiteData();
  const description = `Selected application development work by ${settings.developerName}.`;
  return {
    title: "Projects",
    description,
    alternates: { canonical: absoluteUrl("/projects") },
    robots: { index: seo.robotsIndex, follow: seo.robotsFollow },
    openGraph: { type: "website", url: absoluteUrl("/projects"), title: `Projects — ${settings.developerName}`, description, siteName: settings.siteName },
  };
}

export default async function ProjectsPage() {
  const [data, projects] = await Promise.all([getSiteData(), getAllProjects()]);
  const label = data.sections.projects.content.previewLabel || "Preview Project";
  return (
    <div className="px-5 pb-24 pt-8 sm:px-10 lg:px-20 lg:pt-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            { "@type": "CollectionPage", "@id": `${absoluteUrl("/projects")}#page`, url: absoluteUrl("/projects"), name: "Projects", isPartOf: { "@id": `${siteUrl()}/#website` } },
            breadcrumbSchema([{ name: "Home", url: siteUrl() }, { name: "Projects", url: absoluteUrl("/projects") }]),
          ],
        }}
      />
      <nav aria-label="Breadcrumb" className="text-[13px] text-muted">
        <ol className="flex items-center gap-2">
          <li><Link href="/" className="hover:text-ink">Home</Link></li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-ink">Projects</li>
        </ol>
      </nav>
      <h1 className="display mt-10 text-center text-[clamp(2.8rem,8vw,6rem)]">
        <span className="line-mask"><span>All Projects</span></span>
      </h1>
      {projects.length === 0 ? (
        <p className="mt-12 text-center text-muted">Projects will appear here soon.</p>
      ) : (
        <div className="mx-auto mt-16 grid max-w-[1100px] gap-x-[8%] gap-y-16 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-[5%]">
          {projects.map((project, n) => (
            <Reveal key={project.id} delay={(n % 3) * 0.08}>
              <ProjectCard project={project} filled={n === 0} label={label} priority={n < 3} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
