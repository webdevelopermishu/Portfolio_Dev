import type { Metadata } from "next";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { ProjectView } from "@/components/public/ProjectView";
import { JsonLd } from "@/components/shared/JsonLd";
import { db } from "@/lib/db";
import { findRedirect, getAdjacentProjects, getProject, getSiteData, livePublished } from "@/lib/services/content";
import { projectMetadata } from "@/lib/seo/metadata";
import { projectGraph } from "@/lib/seo/jsonld";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  try {
    return await db.project.findMany({ where: livePublished(), select: { slug: true } });
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return { title: "Project not found", robots: { index: false } };
  return projectMetadata(project, await getSiteData());
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) {
    const moved = await findRedirect(`/projects/${slug}`);
    if (moved) (moved.permanent ? permanentRedirect : redirect)(moved.destination);
    notFound();
  }
  const [data, adjacent] = await Promise.all([getSiteData(), getAdjacentProjects(project.id)]);
  return (
    <>
      <JsonLd data={projectGraph(project, data)} />
      <ProjectView project={project} prev={adjacent.prev} next={adjacent.next} />
    </>
  );
}
