import { AdminShell } from "@/components/admin/AdminShell";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [newLeads, settings] = await Promise.all([
    db.contactLead.count({ where: { status: "NEW" } }),
    db.siteSettings.findUnique({ where: { id: 1 }, select: { siteName: true } }),
  ]);
  return (
    <AdminShell user={{ name: user.name, email: user.email, role: user.role }} newLeads={newLeads} siteName={settings?.siteName ?? "Portfolio"}>
      {children}
    </AdminShell>
  );
}
