import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { mediaLookup } from "@/lib/services/admin";
import { SettingsForm } from "@/components/admin/forms";
import { Badge, PageHeader } from "@/components/admin/table";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsAdmin() {
  await requireUser("ADMIN");
  const settings = await db.siteSettings.findUniqueOrThrow({ where: { id: 1 } });
  const media = await mediaLookup([settings.logoId, settings.faviconId, settings.profileImageId, settings.cvId]);
  const emailReady = Boolean(process.env.RESEND_API_KEY);
  const storageDriver = process.env.STORAGE_DRIVER || "local";
  return (
    <>
      <PageHeader title="Settings" description="Identity, contact details, branding and email for the whole site." />
      <section className="a-card mb-5 grid gap-4 p-5 text-[13px] sm:grid-cols-2" aria-label="Service status">
        <div>
          <p className="flex items-center gap-2 font-medium">Email delivery <Badge status={emailReady ? "PUBLISHED" : "NEW"} label={emailReady ? "Configured" : "Not configured"} /></p>
          <p className="a-help">{emailReady ? `Sending through Resend from ${process.env.EMAIL_FROM || "onboarding@resend.dev"}.` : "Set RESEND_API_KEY and EMAIL_FROM on the server to send emails. Until then, leads are still saved and emails are written to the server log."}</p>
        </div>
        <div>
          <p className="flex items-center gap-2 font-medium">File storage <Badge status="PUBLISHED" label={storageDriver} /></p>
          <p className="a-help">{storageDriver === "cloudinary" ? "Uploads are stored in Cloudinary." : "Uploads are stored on this server's disk. Use Cloudinary (STORAGE_DRIVER=cloudinary) on hosts without persistent storage."}</p>
        </div>
      </section>
      <SettingsForm key={settings.updatedAt.getTime()} initial={settings} media={media} />
    </>
  );
}
