import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { leadWhere } from "@/lib/services/leads";
import { Badge, EmptyState, Filters, PageHeader, Pagination, pageParam } from "@/components/admin/table";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Leads" };
const PAGE_SIZE = 20;
const STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "CLOSED"];

export default async function LeadsAdmin({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const page = pageParam(sp.page);
  const where = leadWhere(sp);
  const [leads, total] = await Promise.all([
    db.contactLead.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, include: { _count: { select: { notes: true } } } }),
    db.contactLead.count({ where }),
  ]);
  const filtered = Boolean(sp.q || sp.status);
  const exportParams = new URLSearchParams(Object.entries({ q: sp.q, status: sp.status }).filter((e): e is [string, string] => Boolean(e[1])));
  return (
    <>
      <PageHeader title="Leads" description="Inquiries submitted through the contact form.">
        <a href={`/api/leads/export?${exportParams}`} className="a-btn"><Download className="size-4" aria-hidden />Export CSV</a>
      </PageHeader>
      <Filters q={sp.q} placeholder="Search name, email, message…" selects={[{ name: "status", label: "Status", value: sp.status, options: STATUSES.map((s) => ({ value: s, label: s.charAt(0) + s.slice(1).toLowerCase() })) }]} />
      <div className="a-card overflow-hidden">
        {leads.length === 0 ? (
          <EmptyState title={filtered ? "No leads match these filters" : "No inquiries yet"} description={filtered ? "Try a different search or clear the filters." : "When someone submits the contact form, it shows up here and you receive an email."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="a-table">
              <thead><tr><th>Contact</th><th>Project type</th><th>Budget</th><th>Message</th><th>Status</th><th>Received</th></tr></thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td><Link href={`/admin/leads/${lead.id}`} className="font-medium underline-offset-2 hover:underline">{lead.name}</Link><div className="text-xs text-gray-500">{lead.email}</div></td>
                    <td>{lead.projectType || "—"}</td>
                    <td className="whitespace-nowrap">{lead.budget || "—"}</td>
                    <td className="max-w-xs"><p className="line-clamp-2 text-gray-600">{lead.message}</p></td>
                    <td><Badge status={lead.status} />{lead._count.notes > 0 && <div className="mt-1 text-[11px] text-gray-500">{lead._count.notes} note{lead._count.notes === 1 ? "" : "s"}</div>}</td>
                    <td className="whitespace-nowrap text-gray-600">{formatDate(lead.createdAt, { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</td>
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
