import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, Phone, Trash2 } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { deleteLead, deleteLeadNote, setLeadStatus } from "@/lib/actions/admin";
import { Badge, PageHeader } from "@/components/admin/table";
import { ActionButton, ConfirmButton } from "@/components/admin/ui";
import { formatDate } from "@/lib/utils";
import { NoteForm } from "./NoteForm";

export const metadata: Metadata = { title: "Lead" };
const STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "CLOSED"] as const;
const stamp = { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" } as const;

export default async function LeadDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const lead = await db.contactLead.findUnique({ where: { id }, include: { notes: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } } } });
  if (!lead) notFound();
  const facts = [["Email", lead.email], ["Phone", lead.phone || "—"], ["Budget", lead.budget || "—"], ["Project type", lead.projectType || "—"], ["Received", formatDate(lead.createdAt, stamp)]];

  return (
    <>
      <PageHeader title={lead.name} description={`Inquiry received ${formatDate(lead.createdAt, stamp)}`}>
        <Link href="/admin/leads" className="a-btn">Back to leads</Link>
        <a href={`mailto:${lead.email}?subject=${encodeURIComponent("Re: your project inquiry")}`} className="a-btn a-btn-primary"><Mail className="size-4" aria-hidden />Reply by email</a>
        {lead.phone && <a href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`} className="a-btn"><Phone className="size-4" aria-hidden />Call</a>}
        {user.role === "ADMIN" && (
          <ConfirmButton action={deleteLead.bind(null, lead.id)} redirectTo="/admin/leads" title="Delete this lead?" description="The inquiry and its notes will be permanently removed."><Trash2 className="size-4" aria-hidden />Delete</ConfirmButton>
        )}
      </PageHeader>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-5">
          <section className="a-card p-5">
            <h2 className="text-sm font-semibold">Project details</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#30364a]">{lead.message}</p>
          </section>
          <section className="a-card p-5">
            <h2 className="text-sm font-semibold">Internal notes</h2>
            <NoteForm leadId={lead.id} />
            {lead.notes.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">No notes yet. Notes are only visible in the dashboard.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {lead.notes.map((note) => (
                  <li key={note.id} className="rounded-xl bg-[#f6f7fa] p-3.5">
                    <p className="whitespace-pre-wrap text-sm">{note.body}</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                      <span>{note.author?.name ?? "Deleted user"} · {formatDate(note.createdAt, stamp)}</span>
                      <ConfirmButton action={deleteLeadNote.bind(null, note.id)} className="underline underline-offset-2" title="Delete this note?" confirmLabel="Delete note">Delete</ConfirmButton>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-5">
          <section className="a-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Status</h2>
              <Badge status={lead.status} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {STATUSES.map((status) => (
                <ActionButton key={status} action={setLeadStatus.bind(null, lead.id, status)} className={`a-btn ${lead.status === status ? "a-btn-primary" : ""}`}>
                  {status.charAt(0) + status.slice(1).toLowerCase()}
                </ActionButton>
              ))}
            </div>
          </section>
          <section className="a-card p-5">
            <h2 className="text-sm font-semibold">Contact</h2>
            <dl className="mt-3 divide-y divide-[#eef0f5] text-[13px]">
              {facts.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 py-2"><dt className="text-gray-500">{label}</dt><dd className="break-all text-right font-medium">{value}</dd></div>
              ))}
            </dl>
            <p className="a-help mt-3">
              Notification email: {lead.ownerEmailSent ? "sent" : "not sent"} · Confirmation to sender: {lead.senderEmailSent ? "sent" : "not sent"}
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
