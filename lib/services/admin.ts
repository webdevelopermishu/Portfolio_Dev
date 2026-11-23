import "server-only";
import { db } from "@/lib/db";
import type { MediaItem } from "@/lib/actions/admin";
import { mediaSelect } from "@/lib/services/content";

/** Loads the media records a form refers to, keyed by id, so previews render immediately. */
export async function mediaLookup(ids: Array<string | null | undefined>): Promise<Record<string, MediaItem>> {
  const wanted = [...new Set(ids.filter((id): id is string => typeof id === "string" && id.length > 0))];
  if (!wanted.length) return {};
  const items = await db.media.findMany({ where: { id: { in: wanted } }, select: mediaSelect });
  return Object.fromEntries(items.map((m) => [m.id, m]));
}
