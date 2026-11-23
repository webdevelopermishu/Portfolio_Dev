import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowUp, Copy, Eye, Pencil, Star, Trash2 } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { deleteEntity, duplicateProject, moveEntity, toggleEntity } from "@/lib/actions/admin";
import { Badge, EmptyState, Filters, PageHeader, Pagination, pageParam } from "@/components/admin/table";
import { ActionButton, ConfirmButton } from "@/components/admin/ui";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Projects" };
const PAGE_SIZE = 10;

export default async function ProjectsAdmin({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; featured?: string; page?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const page = pageParam(sp.page);
  const where: Prisma.ProjectWhereInput = {
    ...(sp.q ? { OR: [{ title: { contains: sp.q, mode: "insensitive" } }, { category: { contains: sp.q, mode: "insensitive" } }, { clientName: { contains: sp.q, mode: "insensitive" } }] } : {}),
    ...(sp.status === "DRAFT" || sp.status === "PUBLISHED" ? { status: sp.status } : {}),
    ...(sp.featured === "yes" ? { featured: true } : sp.featured === "no" ? { featured: false } : {}),
  };
  const [projects, total] = await Promise.all([
    db.project.findMany({ where, orderBy: [{ order: "asc" }, { id: "asc" }], skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, include: { featuredImage: { select: { url: true } } } }),
    db.project.count({ where }),
  ]);
  const filtered = Boolean(sp.q || sp.status || sp.featured);
  const now = new Date();

  return (
    <>
      <PageHeader title="Projects" description="Create, order, feature and publish the work shown in your portfolio.">
        <Link href="/admin/projects/new" className="a-btn a-btn-primary">New project</Link>
      </PageHeader>
      <Filters q={sp.q} placeholder="Search projects…" selects={[
        { name: "status", label: "Status", value: sp.status, options: [{ value: "PUBLISHED", label: "Published" }, { value: "DRAFT", label: "Draft" }] },
        { name: "featured", label: "Featured", value: sp.featured, options: [{ value: "yes", label: "Featured" }, { value: "no", label: "Not featured" }] },
      ]} />
      <div className="a-card overflow-hidden">
        {projects.length === 0 ? (
          <EmptyState title={filtered ? "No projects match these filters" : "No projects yet"} description={filtered ? "Try a different search or clear the filters." : "Add your first project to start building the portfolio."}>
            {!filtered && <Link href="/admin/projects/new" className="a-btn a-btn-primary">New project</Link>}
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="a-table">
              <thead><tr><th className="w-10">Order</th><th>Project</th><th>Category</th><th>Status</th><th>Updated</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {projects.map((p) => {
                  const scheduled = p.status === "PUBLISHED" && p.publishAt && p.publishAt > now;
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="flex flex-col">
                          <ActionButton action={moveEntity.bind(null, "project", p.id, "up")} className="rounded p-0.5 text-gray-500 hover:bg-gray-100" label="Move up"><ArrowUp className="size-3.5" aria-hidden /></ActionButton>
                          <ActionButton action={moveEntity.bind(null, "project", p.id, "down")} className="rounded p-0.5 text-gray-500 hover:bg-gray-100" label="Move down"><ArrowDown className="size-3.5" aria-hidden /></ActionButton>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <span className="size-11 shrink-0 overflow-hidden rounded-lg bg-[#f3f4f8]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            {p.featuredImage && <img src={p.featuredImage.url} alt="" className="size-full object-cover" />}
                          </span>
                          <span className="min-w-0">
                            <Link href={`/admin/projects/${p.id}`} className="block truncate font-medium underline-offset-2 hover:underline">{p.title}</Link>
                            <span className="block truncate text-xs text-gray-500">/projects/{p.slug}</span>
                          </span>
                        </div>
                      </td>
                      <td className="text-gray-600">{p.category || "—"}</td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          <Badge status={scheduled ? "SCHEDULED" : p.status} />
                          {p.featured && <Badge status="FEATURED" />}
                        </div>
                        {scheduled && <div className="mt-1 text-[11px] text-gray-500">Goes live {formatDate(p.publishAt, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</div>}
                      </td>
                      <td className="whitespace-nowrap text-gray-600">{formatDate(p.updatedAt)}</td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <ActionButton action={toggleEntity.bind(null, "project", p.id, "status")} className="a-btn">{p.status === "PUBLISHED" ? "Unpublish" : "Publish"}</ActionButton>
                          <ActionButton action={toggleEntity.bind(null, "project", p.id, "featured")} className="a-btn a-btn-icon" label={p.featured ? "Remove from featured" : "Mark as featured"}><Star className={`size-4 ${p.featured ? "fill-amber-400 text-amber-500" : ""}`} aria-hidden /></ActionButton>
                          <Link href={`/preview/projects/${p.slug}`} target="_blank" className="a-btn a-btn-icon" aria-label="Preview" title="Preview"><Eye className="size-4" aria-hidden /></Link>
                          <Link href={`/admin/projects/${p.id}`} className="a-btn a-btn-icon" aria-label="Edit" title="Edit"><Pencil className="size-4" aria-hidden /></Link>
                          <ActionButton action={duplicateProject.bind(null, p.id)} className="a-btn a-btn-icon" label="Duplicate"><Copy className="size-4" aria-hidden /></ActionButton>
                          <ConfirmButton action={deleteEntity.bind(null, "project", p.id)} className="a-btn a-btn-icon a-btn-danger" label="Delete" title={`Delete “${p.title}”?`} description="The project page will be removed from the site. This cannot be undone."><Trash2 className="size-4" aria-hidden /></ConfirmButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} params={{ q: sp.q, status: sp.status, featured: sp.featured }} />
      </div>
    </>
  );
}
