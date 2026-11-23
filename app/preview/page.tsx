import { HomeSections } from "@/components/public/HomeSections";
import { requireUser } from "@/lib/auth/session";
import { getSiteData } from "@/lib/services/content";

export default async function PreviewHome() {
  await requireUser();
  return <HomeSections data={await getSiteData(true)} projectHrefBase="/preview/projects" />;
}
