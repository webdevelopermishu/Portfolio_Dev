import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { mediaLookup } from "@/lib/services/admin";
import { ClientForm } from "@/components/admin/forms";
import { PageHeader } from "@/components/admin/table";

export const metadata: Metadata = { title: "Edit client" };

export default async function ClientEdit({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const isNew = id === "new";
  const item = isNew ? null : await db.client.findUnique({ where: { id } });
  if (!isNew && !item) notFound();
  const initial = item ? { ...item } : { visible: true, order: await db.client.count() };
  const media = await mediaLookup([item?.logoId]);
  return (
    <>
      <PageHeader title={item ? item.name : "New client"}>
        <Link href="/admin/clients" className="a-btn">Back to clients</Link>
      </PageHeader>
      <ClientForm id={item?.id ?? null} initial={initial} media={media} />
    </>
  );
}
