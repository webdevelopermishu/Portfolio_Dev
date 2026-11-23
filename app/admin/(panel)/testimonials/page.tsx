import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowUp, Pencil, Star, Trash2 } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { deleteEntity, moveEntity, toggleEntity } from "@/lib/actions/admin";
import { Badge, EmptyState, Filters, PageHeader, Pagination, pageParam } from "@/components/admin/table";
import { ActionButton, ConfirmButton } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Testimonials" };
const PAGE_SIZE = 10;

export default async function TestimonialsAdmin({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const page = pageParam(sp.page);
  const where: Prisma.TestimonialWhereInput = {
    ...(sp.q ? { OR: [{ name: { contains: sp.q, mode: "insensitive" } }, { company: { contains: sp.q, mode: "insensitive" } }, { text: { contains: sp.q, mode: "insensitive" } }] } : {}),
    ...(sp.status === "DRAFT" || sp.status === "PUBLISHED" ? { status: sp.status } : {}),
  };
  const [items, total] = await Promise.all([
    db.testimonial.findMany({ where, orderBy: [{ order: "asc" }, { id: "asc" }], skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    db.testimonial.count({ where }),
  ]);
  const filtered = Boolean(sp.q || sp.status);
  return (
    <>
      <PageHeader title="Testimonials" description="Only published testimonials appear on the site. Publish reviews that real clients have given you permission to use.">
        <Link href="/admin/testimonials/new" className="a-btn a-btn-primary">New testimonial</Link>
      </PageHeader>
      <Filters q={sp.q} placeholder="Search testimonials…" selects={[{ name: "status", label: "Status", value: sp.status, options: [{ value: "PUBLISHED", label: "Published" }, { value: "DRAFT", label: "Draft" }] }]} />
      <div className="a-card overflow-hidden">
        {items.length === 0 ? (
          <EmptyState title={filtered ? "No testimonials match" : "No testimonials yet"} description={filtered ? "Try a different search." : "Add a client review to show it in the carousel."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="a-table">
              <thead><tr><th className="w-10">Order</th><th>Client</th><th>Review</th><th>Rating</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {items.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div className="flex flex-col">
                        <ActionButton action={moveEntity.bind(null, "testimonial", t.id, "up")} className="rounded p-0.5 text-gray-500 hover:bg-gray-100" label="Move up"><ArrowUp className="size-3.5" aria-hidden /></ActionButton>
                        <ActionButton action={moveEntity.bind(null, "testimonial", t.id, "down")} className="rounded p-0.5 text-gray-500 hover:bg-gray-100" label="Move down"><ArrowDown className="size-3.5" aria-hidden /></ActionButton>
                      </div>
                    </td>
                    <td><Link href={`/admin/testimonials/${t.id}`} className="font-medium underline-offset-2 hover:underline">{t.name}</Link><div className="text-xs text-gray-500">{[t.designation, t.company].filter(Boolean).join(", ")}</div></td>
                    <td className="max-w-xs"><p className="line-clamp-2 text-gray-600">{t.text}</p></td>
                    <td className="whitespace-nowrap">{t.rating} / 5</td>
                    <td><div className="flex flex-wrap gap-1"><Badge status={t.status} />{t.featured && <Badge status="FEATURED" />}</div></td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <ActionButton action={toggleEntity.bind(null, "testimonial", t.id, "status")} className="a-btn">{t.status === "PUBLISHED" ? "Unpublish" : "Publish"}</ActionButton>
                        <ActionButton action={toggleEntity.bind(null, "testimonial", t.id, "featured")} className="a-btn a-btn-icon" label={t.featured ? "Remove from featured" : "Mark as featured"}><Star className={`size-4 ${t.featured ? "fill-amber-400 text-amber-500" : ""}`} aria-hidden /></ActionButton>
                        <Link href={`/admin/testimonials/${t.id}`} className="a-btn a-btn-icon" aria-label="Edit" title="Edit"><Pencil className="size-4" aria-hidden /></Link>
                        <ConfirmButton action={deleteEntity.bind(null, "testimonial", t.id)} className="a-btn a-btn-icon a-btn-danger" label="Delete" title={`Delete the testimonial from ${t.name}?`} description="This cannot be undone."><Trash2 className="size-4" aria-hidden /></ConfirmButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} params={{ q: sp.q, status: sp.status }} />
      </div>
    </>
  );
}
