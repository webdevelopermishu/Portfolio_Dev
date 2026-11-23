import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ListEditor } from "@/components/admin/ListEditor";
import { PageHeader } from "@/components/admin/table";

export const metadata: Metadata = { title: "Navigation & social" };

export default async function NavigationAdmin() {
  await requireUser();
  const [nav, socials] = await Promise.all([
    db.navItem.findMany({ orderBy: { order: "asc" } }),
    db.socialLink.findMany({ orderBy: { order: "asc" } }),
  ]);
  return (
    <>
      <PageHeader title="Navigation & social" description="Links in the site header, and the social profiles shown in the contact section and footer." />
      <div className="space-y-5">
        <ListEditor kind="nav" title="Header navigation" description="Use /#about style links for sections of the home page, or a path such as /projects." rows={nav} addLabel="Add link" />
        <ListEditor kind="social" title="Social media links" description="“Footer” controls whether a profile also appears as a large link in the footer." rows={socials} addLabel="Add profile" />
      </div>
    </>
  );
}
