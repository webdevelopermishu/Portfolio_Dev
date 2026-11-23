import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { mediaLookup } from "@/lib/services/admin";
import { SeoForm } from "@/components/admin/forms";
import { ListEditor } from "@/components/admin/ListEditor";
import { PageHeader } from "@/components/admin/table";
import { siteUrl } from "@/lib/utils";

export const metadata: Metadata = { title: "SEO" };

export default async function SeoAdmin() {
  const user = await requireUser();
  const [page, redirects, settings] = await Promise.all([
    db.page.findUniqueOrThrow({ where: { slug: "home" }, include: { seo: true } }),
    db.redirect.findMany({ orderBy: { createdAt: "asc" } }),
    db.siteSettings.findUnique({ where: { id: 1 }, select: { profileImage: { select: { url: true } } } }),
  ]);
  const seo = page.seo!;
  const media = await mediaLookup([seo.ogImageId]);
  return (
    <>
      <PageHeader title="SEO" description="Search and social settings for the site. Each project has its own SEO fields on its edit page.">
        <a href="/sitemap.xml" target="_blank" className="a-btn">View sitemap</a>
        <a href="/robots.txt" target="_blank" className="a-btn">View robots.txt</a>
      </PageHeader>
      <SeoForm key={seo.updatedAt.getTime()} initial={seo} media={media} siteUrl={siteUrl()} fallbackImage={settings?.profileImage?.url} />
      {user.role === "ADMIN" && (
        <div className="mt-5">
          <ListEditor
            kind="redirect"
            title="Redirects"
            description="Send visitors and search engines from an old path to a new one. A redirect is added automatically when a published project's slug changes."
            rows={redirects.map((r) => ({ ...r, visible: r.enabled }))}
            toggleLabel="Enabled"
            addLabel="Add redirect"
          />
        </div>
      )}
    </>
  );
}
