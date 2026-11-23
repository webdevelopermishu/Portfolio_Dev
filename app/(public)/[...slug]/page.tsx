import { notFound, permanentRedirect, redirect } from "next/navigation";
import { findRedirect } from "@/lib/services/content";

/** Any path without a page: apply a redirect managed in the dashboard, otherwise 404. */
export default async function CatchAll({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const moved = await findRedirect(`/${slug.join("/")}`);
  if (moved) (moved.permanent ? permanentRedirect : redirect)(moved.destination);
  notFound();
}
