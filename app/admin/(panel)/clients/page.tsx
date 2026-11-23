import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { deleteEntity, moveEntity, toggleEntity } from "@/lib/actions/admin";
import { Badge, EmptyState, Filters, PageHeader, Pagination, pageParam } from "@/components/admin/table";
import { ActionButton, ConfirmButton } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Clients" };
const PAGE_SIZE = 12;

export default async function ClientsAdmin({ searchParams }: { searchParams: Promise<{ q?: string; visible?: string; page?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const page = pageParam(sp.page);
  const where: Prisma.ClientWhereInput = {
    ...(sp.q ? { name: { contains: sp.q, mode: "insensitive" } } : {}),
    ...(sp.visible === "yes" ? { visible: true } : sp.visible === "no" ? { visible: false } : {}),
  };
  const [items, total] = await Promise.all([
    db.client.findMany({ where, orderBy: [{ order: "asc" }, { id: "asc" }], skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, include: { logo: { select: { url: true } } } }),
    db.client.count({ where }),
  ]);
  const filtered = Boolean(sp.q || sp.visible);
  return (
    <>
      <PageHeader title="Clients" description="Logos shown in the “Trusted By” section. Heading, layout and logo style are set in Content → Trusted By.">
        <Link href="/admin/content?section=clients" className="a-btn">Section settings</Link>
        <Link href="/admin/clients/new" className="a-btn a-btn-primary">New client</Link>
      </PageHeader>
      <Filters q={sp.q} placeholder="Search clients…" selects={[{ name: "visible", label: "Visibility", value: sp.visible, options: [{ value: "yes", label: "Visible" }, { value: "no", label: "Hidden" }] }]} />
      <div className="a-card overflow-hidden">
        {items.length === 0 ? (
          <EmptyState title={filtered ? "No clients match" : "No clients yet"} description={filtered ? "Try a different search." : "Add a client logo to show it on the site."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="a-table">
              <thead><tr><th className="w-10">Order</th><th>Logo</th><th>Name</th><th>Website</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="flex flex-col">
                        <ActionButton action={moveEntity.bind(null, "client", c.id, "up")} className="rounded p-0.5 text-gray-500 hover:bg-gray-100" label="Move up"><ArrowUp className="size-3.5" aria-hidden /></ActionButton>
                        <ActionButton action={moveEntity.bind(null, "client", c.id, "down")} className="rounded p-0.5 text-gray-500 hover:bg-gray-100" label="Move down"><ArrowDown className="size-3.5" aria-hidden /></ActionButton>
                      </div>
                    </td>
                    <td>
                      <span className="flex h-10 w-28 items-center justify-center rounded-lg bg-[#f3f4f8] p-1.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {c.logo ? <img src={c.logo.url} alt="" className="max-h-full max-w-full object-contain" /> : <span className="text-[11px] text-gray-400">No logo</span>}
                      </span>
                    </td>
                    <td><Link href={`/admin/clients/${c.id}`} className="font-medium underline-offset-2 hover:underline">{c.name}</Link></td>
                    <td className="max-w-[200px] truncate text-gray-600">{c.url || "—"}</td>
                    <td><Badge status={c.visible ? "VISIBLE" : "HIDDEN"} /></td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <ActionButton action={toggleEntity.bind(null, "client", c.id, "visible")} className="a-btn">{c.visible ? "Hide" : "Show"}</ActionButton>
                        <Link href={`/admin/clients/${c.id}`} className="a-btn a-btn-icon" aria-label="Edit" title="Edit"><Pencil className="size-4" aria-hidden /></Link>
                        <ConfirmButton action={deleteEntity.bind(null, "client", c.id)} className="a-btn a-btn-icon a-btn-danger" label="Delete" title={`Delete ${c.name}?`} description="The logo will be removed from the site."><Trash2 className="size-4" aria-hidden /></ConfirmButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} params={{ q: sp.q, visible: sp.visible }} />
      </div>
    </>
  );
}
