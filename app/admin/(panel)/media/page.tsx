import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { mediaSelect } from "@/lib/services/content";
import { Filters, PageHeader, Pagination, pageParam } from "@/components/admin/table";
import { MediaLibrary } from "./MediaLibrary";

export const metadata: Metadata = { title: "Media" };
const PAGE_SIZE = 24;

export default async function MediaAdmin({ searchParams }: { searchParams: Promise<{ q?: string; type?: string; page?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const page = pageParam(sp.page);
  const where = {
    ...(sp.q ? { OR: [{ filename: { contains: sp.q, mode: "insensitive" as const } }, { alt: { contains: sp.q, mode: "insensitive" as const } }] } : {}),
    ...(sp.type === "image" ? { mime: { startsWith: "image/" } } : sp.type === "file" ? { mime: "application/pdf" } : {}),
  };
  const [items, total] = await Promise.all([
    db.media.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, select: { ...mediaSelect, size: true, createdAt: true, provider: true } }),
    db.media.count({ where }),
  ]);
  return (
    <>
      <PageHeader title="Media" description="Images and files used across the site. Accepted: JPG, PNG, WebP, AVIF, GIF, ICO and PDF, up to 10 MB each." />
      <Filters q={sp.q} placeholder="Search files…" selects={[{ name: "type", label: "Type", value: sp.type, options: [{ value: "image", label: "Images" }, { value: "file", label: "PDF files" }] }]} />
      <MediaLibrary items={items} filtered={Boolean(sp.q || sp.type)} />
      <div className="a-card mt-4 overflow-hidden empty:hidden">
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} params={{ q: sp.q, type: sp.type }} />
      </div>
    </>
  );
}
