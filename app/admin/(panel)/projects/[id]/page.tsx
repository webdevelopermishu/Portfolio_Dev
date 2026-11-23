import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { deleteEntity } from "@/lib/actions/admin";
import { mediaLookup } from "@/lib/services/admin";
import { ProjectForm } from "@/components/admin/forms";
import { PageHeader } from "@/components/admin/table";
import { ConfirmButton } from "@/components/admin/ui";
import { siteUrl } from "@/lib/utils";

export const metadata: Metadata = { title: "Edit project" };

export default async function ProjectEdit({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const isNew = id === "new";
  const project = isNew ? null : await db.project.findUnique({ where: { id }, include: { images: { orderBy: { order: "asc" } } } });
  if (!isNew && !project) notFound();

  const gallery = project?.images.map((i) => i.mediaId) ?? [];
  const initial = project
    ? { ...project, gallery }
    : { status: "DRAFT", projectStatus: "Completed", robotsIndex: true, includeInSitemap: true, featured: false, order: await db.project.count(), gallery: [], technologies: [] };
  const media = await mediaLookup([project?.featuredImageId, project?.ogImageId, ...gallery]);

  return (
    <>
      <PageHeader title={project ? project.title : "New project"} description={project ? `/projects/${project.slug}` : "Fill in the details, then save. New projects start as drafts."}>
        <Link href="/admin/projects" className="a-btn">Back to projects</Link>
        {project && (
          <ConfirmButton action={deleteEntity.bind(null, "project", project.id)} redirectTo="/admin/projects" title={`Delete “${project.title}”?`} description="The project page will be removed from the site. This cannot be undone.">Delete</ConfirmButton>
        )}
      </PageHeader>
      <ProjectForm key={project?.updatedAt.getTime() ?? "new"} id={project?.id ?? null} slug={project?.slug} siteUrl={siteUrl()} initial={initial} media={media} />
    </>
  );
}
