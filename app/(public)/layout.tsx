import { SiteShell } from "@/components/public/SiteShell";
import { getSiteData } from "@/lib/services/content";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell data={await getSiteData()}>{children}</SiteShell>;
}
