import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/table";
import { UsersManager } from "./UsersManager";

export const metadata: Metadata = { title: "Users" };

export default async function UsersAdmin() {
  const current = await requireUser("ADMIN");
  const users = await db.user.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, name: true, email: true, role: true, lastLoginAt: true } });
  return (
    <>
      <PageHeader title="Users" description="Administrators can change everything. Editors manage content, projects, testimonials, clients, media and leads, but not settings, redirects, users or lead deletion." />
      <UsersManager users={users} currentId={current.id} />
    </>
  );
}
