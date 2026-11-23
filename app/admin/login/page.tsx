import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await getSessionUser()) redirect("/admin");
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f6f7fa] p-4 text-[#0f1524]">
      <div className="a-card w-full max-w-sm p-7">
        <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-gray-600">Manage your portfolio content.</p>
        <LoginForm />
      </div>
    </main>
  );
}
