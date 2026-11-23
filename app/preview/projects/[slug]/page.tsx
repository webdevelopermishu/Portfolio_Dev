import { notFound } from "next/navigation";
import { ProjectView } from "@/components/public/ProjectView";
import { requireUser } from "@/lib/auth/session";
import { getProject } from "@/lib/services/content";

export default async function PreviewProject({ params }: { params: Promise<{ slug: string }> }) {
  await requireUser();
  const { slug } = await params;
  const project = await getProject(slug, true);
  if (!project) notFound();
  return <ProjectView project={project} />;
}
