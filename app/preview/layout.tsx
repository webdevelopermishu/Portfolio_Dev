import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/public/SiteShell";
import { requireUser } from "@/lib/auth/session";
import { getSiteData } from "@/lib/services/content";

export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };

/** Signed-in users only: shows drafts and unpublished items exactly as they would appear publicly. */
export default async function PreviewLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  const data = await getSiteData(true);
  return (
    <>
      <div role="status" className="sticky top-0 z-[75] flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-amber-300 px-4 py-2 text-center text-[13px] font-medium text-black">
        Preview mode — includes unpublished drafts. Visitors cannot see this page.
        <Link href="/admin/content" className="underline underline-offset-2">Back to dashboard</Link>
      </div>
      <SiteShell data={data} track={false}>{children}</SiteShell>
    </>
  );
}
