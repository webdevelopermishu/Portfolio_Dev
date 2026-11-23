"use client";

import { useState } from "react";
import { changePassword, updateProfile } from "@/lib/actions/admin";
import { Spinner, useAction } from "@/components/admin/ui";

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const [values, setValues] = useState({ name, email });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { pending, run } = useAction();
  return (
    <form className="a-card space-y-4 p-5" noValidate onSubmit={(e) => { e.preventDefault(); run(() => updateProfile(values), (r) => setErrors(r.ok ? {} : (r.fieldErrors ?? {}))); }}>
      <h2 className="text-sm font-semibold">Account</h2>
      <div>
        <label htmlFor="profile-name" className="a-label">Name</label>
        <input id="profile-name" className="a-input" autoComplete="name" value={values.name} aria-invalid={errors.name ? true : undefined} onChange={(e) => setValues({ ...values, name: e.target.value })} />
        {errors.name && <p role="alert" className="mt-1 text-xs text-red-600">{errors.name}</p>}
      </div>
      <div>
        <label htmlFor="profile-email" className="a-label">Email</label>
        <input id="profile-email" type="email" className="a-input" autoComplete="email" value={values.email} aria-invalid={errors.email ? true : undefined} onChange={(e) => setValues({ ...values, email: e.target.value })} />
        {errors.email && <p role="alert" className="mt-1 text-xs text-red-600">{errors.email}</p>}
      </div>
      <button type="submit" className="a-btn a-btn-primary" disabled={pending}>{pending && <Spinner />}Save profile</button>
    </form>
  );
}

export function PasswordForm() {
  const empty = { current: "", next: "", confirm: "" };
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { pending, run } = useAction();
  return (
    <form
      className="a-card space-y-4 p-5"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (values.next !== values.confirm) return setErrors({ confirm: "The passwords do not match" });
        run(() => changePassword({ current: values.current, next: values.next }), (r) => {
          setErrors(r.ok ? {} : (r.fieldErrors ?? {}));
          if (r.ok) setValues(empty);
        });
      }}
    >
      <h2 className="text-sm font-semibold">Change password</h2>
      {([["current", "Current password", "current-password"], ["next", "New password", "new-password"], ["confirm", "Confirm new password", "new-password"]] as const).map(([key, label, auto]) => (
        <div key={key}>
          <label htmlFor={`pw-${key}`} className="a-label">{label}</label>
          <input id={`pw-${key}`} type="password" className="a-input" autoComplete={auto} value={values[key]} aria-invalid={errors[key] ? true : undefined} onChange={(e) => setValues({ ...values, [key]: e.target.value })} />
          {errors[key] && <p role="alert" className="mt-1 text-xs text-red-600">{errors[key]}</p>}
        </div>
      ))}
      <p className="a-help">At least 10 characters, with a letter and a number. Changing it signs out your other sessions.</p>
      <button type="submit" className="a-btn a-btn-primary" disabled={pending}>{pending && <Spinner />}Change password</button>
    </form>
  );
}
