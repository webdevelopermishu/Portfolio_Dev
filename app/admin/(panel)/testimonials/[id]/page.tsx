import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { mediaLookup } from "@/lib/services/admin";
import { TestimonialForm } from "@/components/admin/forms";
import { PageHeader } from "@/components/admin/table";

export const metadata: Metadata = { title: "Edit testimonial" };

export default async function TestimonialEdit({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const isNew = id === "new";
  const item = isNew ? null : await db.testimonial.findUnique({ where: { id } });
  if (!isNew && !item) notFound();
  const initial = item ? { ...item, rating: String(item.rating) } : { rating: "5", status: "DRAFT", featured: false, order: await db.testimonial.count() };
  const media = await mediaLookup([item?.avatarId, item?.companyLogoId]);
  return (
    <>
      <PageHeader title={item ? item.name : "New testimonial"}>
        <Link href="/admin/testimonials" className="a-btn">Back to testimonials</Link>
      </PageHeader>
      <TestimonialForm id={item?.id ?? null} initial={initial} media={media} />
    </>
  );
}
