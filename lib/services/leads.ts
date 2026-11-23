import type { Prisma } from "@/lib/generated/prisma/client";

const STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "CLOSED"] as const;

/** Shared by the leads table and the CSV export so both apply identical filters. */
export function leadWhere(params: { q?: string | null; status?: string | null }): Prisma.ContactLeadWhereInput {
  const q = params.q?.trim();
  const status = STATUSES.find((s) => s === params.status);
  return {
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } },
            { message: { contains: q, mode: "insensitive" } }, { projectType: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(status ? { status } : {}),
  };
}
