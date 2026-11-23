"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { login } from "@/lib/actions/admin";
import { loginSchema } from "@/lib/validation/schemas";
import { Spinner } from "@/components/admin/ui";

type Input = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Input>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const result = await login(values);
    if (!result.ok) return setError(result.error);
    router.replace("/admin");
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
      <div>
        <label htmlFor="email" className="a-label">Email</label>
        <input id="email" type="email" autoComplete="username" className="a-input" aria-invalid={errors.email ? true : undefined} {...register("email")} />
        {errors.email && <p role="alert" className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
      </div>
      <div>
        <label htmlFor="password" className="a-label">Password</label>
        <input id="password" type="password" autoComplete="current-password" className="a-input" aria-invalid={errors.password ? true : undefined} {...register("password")} />
        {errors.password && <p role="alert" className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
      </div>
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button type="submit" className="a-btn a-btn-primary w-full py-2.5" disabled={isSubmitting}>
        {isSubmitting && <Spinner />}
        Sign in
      </button>
    </form>
  );
}
