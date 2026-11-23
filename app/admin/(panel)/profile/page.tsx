import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/admin/table";
import { PasswordForm, ProfileForm } from "./ProfileForms";

export const metadata: Metadata = { title: "My profile" };

export default async function ProfilePage() {
  const user = await requireUser();
  return (
    <>
      <PageHeader title="My profile" description="Your sign-in details for the dashboard." />
      <div className="grid gap-5 lg:grid-cols-2">
        <ProfileForm name={user.name} email={user.email} />
        <PasswordForm />
      </div>
    </>
  );
}
