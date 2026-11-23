"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { deleteUser, saveUser } from "@/lib/actions/admin";
import { Badge } from "@/components/admin/table";
import { ConfirmButton, Spinner, useAction } from "@/components/admin/ui";
import { formatDate } from "@/lib/utils";

type User = { id: string; name: string; email: string; role: "ADMIN" | "EDITOR"; lastLoginAt: Date | null };
const blank = { name: "", email: "", role: "EDITOR" as User["role"], password: "" };

export function UsersManager({ users, currentId }: { users: User[]; currentId: string }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [values, setValues] = useState(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { pending, run } = useAction();

  const startEdit = (user: User | null) => {
    setEditing(user?.id ?? null);
    setValues(user ? { name: user.name, email: user.email, role: user.role, password: "" } : blank);
    setErrors({});
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="a-card overflow-x-auto">
        <table className="a-table">
          <thead><tr><th>User</th><th>Role</th><th>Last sign-in</th><th className="text-right">Actions</th></tr></thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td><span className="font-medium">{user.name}</span>{user.id === currentId && <span className="ml-1.5 text-xs text-gray-500">(you)</span>}<div className="text-xs text-gray-500">{user.email}</div></td>
                <td><Badge status={user.role} label={user.role === "ADMIN" ? "Administrator" : "Editor"} /></td>
                <td className="whitespace-nowrap text-gray-600">{formatDate(user.lastLoginAt)}</td>
                <td>
                  <div className="flex justify-end gap-1">
                    <button type="button" className="a-btn a-btn-icon" aria-label={`Edit ${user.name}`} onClick={() => startEdit(user)}><Pencil className="size-4" aria-hidden /></button>
                    {user.id !== currentId && (
                      <ConfirmButton action={deleteUser.bind(null, user.id)} className="a-btn a-btn-icon a-btn-danger" label={`Delete ${user.name}`} title={`Delete ${user.name}?`} description="They will no longer be able to sign in."><Trash2 className="size-4" aria-hidden /></ConfirmButton>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form
        className="a-card h-fit space-y-4 p-5"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          run(() => saveUser(editing, values), (r) => {
            setErrors(r.ok ? {} : (r.fieldErrors ?? {}));
            if (r.ok) startEdit(null);
          });
        }}
      >
        <h2 className="text-sm font-semibold">{editing ? "Edit user" : "Add a user"}</h2>
        {([["name", "Name", "text"], ["email", "Email", "email"]] as const).map(([key, label, type]) => (
          <div key={key}>
            <label htmlFor={`user-${key}`} className="a-label">{label}</label>
            <input id={`user-${key}`} type={type} className="a-input" value={values[key]} aria-invalid={errors[key] ? true : undefined} onChange={(e) => setValues({ ...values, [key]: e.target.value })} />
            {errors[key] && <p role="alert" className="mt-1 text-xs text-red-600">{errors[key]}</p>}
          </div>
        ))}
        <div>
          <label htmlFor="user-role" className="a-label">Role</label>
          <select id="user-role" className="a-input" value={values.role} onChange={(e) => setValues({ ...values, role: e.target.value as User["role"] })}>
            <option value="EDITOR">Editor</option>
            <option value="ADMIN">Administrator</option>
          </select>
        </div>
        <div>
          <label htmlFor="user-password" className="a-label">{editing ? "New password (leave empty to keep)" : "Password"}</label>
          <input id="user-password" type="password" autoComplete="new-password" className="a-input" value={values.password} aria-invalid={errors.password ? true : undefined} onChange={(e) => setValues({ ...values, password: e.target.value })} />
          {errors.password ? <p role="alert" className="mt-1 text-xs text-red-600">{errors.password}</p> : <p className="a-help">At least 10 characters, with a letter and a number.</p>}
        </div>
        <div className="flex gap-2">
          <button type="submit" className="a-btn a-btn-primary" disabled={pending}>{pending && <Spinner />}{editing ? "Save user" : "Create user"}</button>
          {editing && <button type="button" className="a-btn" onClick={() => startEdit(null)}>Cancel</button>}
        </div>
      </form>
    </div>
  );
}
