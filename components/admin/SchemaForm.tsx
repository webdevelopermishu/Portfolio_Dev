"use client";

import { useId, useMemo, useState } from "react";
import type { Field, Values } from "@/lib/fields";
import type { MediaItem } from "@/lib/actions/admin";
import type { ActionResult } from "@/lib/validation/fields";
import { MediaField } from "@/components/admin/MediaField";
import { RichText } from "@/components/admin/RichText";
import { Spinner, Switch, useAction, useUnsavedWarning } from "@/components/admin/ui";

export type FormButton = { intent: string; label: string; primary?: boolean };

type Props = {
  fields: Field[];
  initial: Values;
  media?: Record<string, MediaItem>;
  buttons: FormButton[];
  onSubmit: (values: Values, intent: string) => Promise<ActionResult>;
  onDone?: (result: ActionResult, intent: string) => void;
  aside?: (values: Values) => React.ReactNode;
  extraActions?: React.ReactNode;
};

const pad = (n: number) => String(n).padStart(2, "0");

/** Converts stored values into what the inputs expect (dates → input strings, numbers → strings). */
function toFormValue(field: Field, value: unknown): unknown {
  if (field.type === "date" || field.type === "datetime") {
    if (!value) return "";
    const d = new Date(value as string);
    if (Number.isNaN(d.getTime())) return "";
    if (field.type === "date") return d.toISOString().slice(0, 10);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  if (field.type === "checkbox") return Boolean(value);
  if (field.type === "gallery" || field.type === "list") return Array.isArray(value) ? value : [];
  if (field.type === "image" || field.type === "file") return value ?? null;
  return value == null ? "" : String(value);
}

function toSubmitValue(field: Field, value: unknown): unknown {
  if (field.type === "datetime") return value ? new Date(value as string).toISOString() : "";
  if (field.type === "date") return value ? `${value}T00:00:00.000Z` : "";
  return value;
}

export function SchemaForm({ fields, initial, media = {}, buttons, onSubmit, onDone, aside, extraActions }: Props) {
  const uid = useId();
  const start = useMemo(() => Object.fromEntries(fields.map((f) => [f.name, toFormValue(f, initial[f.name])])), [fields, initial]);
  const [values, setValues] = useState<Values>(start);
  const [saved, setSaved] = useState<Values>(start);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [intent, setIntent] = useState("");
  const { pending, run } = useAction();
  const dirty = JSON.stringify(values) !== JSON.stringify(saved);
  useUnsavedWarning(dirty);

  const set = (name: string, value: unknown) => {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => (e[name] ? { ...e, [name]: "" } : e));
  };

  const submit = (which: string) => {
    setIntent(which);
    const payload = Object.fromEntries(fields.map((f) => [f.name, toSubmitValue(f, values[f.name])]));
    run(() => onSubmit(payload, which), (result) => {
      if (result.ok) {
        setSaved(values);
        setErrors({});
      } else {
        setErrors(result.fieldErrors ?? {});
        const first = Object.keys(result.fieldErrors ?? {})[0];
        if (first) document.getElementById(`${uid}-${first}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      onDone?.(result, which);
    });
  };

  const groups = [...new Set(fields.map((f) => f.group ?? ""))];

  const control = (field: Field) => {
    const id = `${uid}-${field.name}`;
    const value = values[field.name];
    const common = { id, "aria-invalid": errors[field.name] ? true : undefined, "aria-describedby": errors[field.name] ? `${id}-error` : field.help ? `${id}-help` : undefined };
    switch (field.type) {
      case "checkbox":
        return <Switch id={id} label={field.label} checked={Boolean(value)} onChange={(v) => set(field.name, v)} />;
      case "textarea":
        return <textarea {...common} className="a-input min-h-[96px]" rows={4} maxLength={field.max} placeholder={field.placeholder} value={String(value ?? "")} onChange={(e) => set(field.name, e.target.value)} />;
      case "list":
        return (
          <textarea
            {...common}
            className="a-input min-h-[110px]"
            rows={5}
            value={(value as string[]).join("\n")}
            onChange={(e) => set(field.name, e.target.value.split("\n"))}
            onBlur={() => set(field.name, (value as string[]).map((s) => s.trim()).filter(Boolean))}
          />
        );
      case "select":
        return (
          <select {...common} className="a-input" value={String(value ?? "")} onChange={(e) => set(field.name, e.target.value)}>
            {field.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        );
      case "rich":
        return <RichText id={id} value={String(value ?? "")} onChange={(html) => set(field.name, html)} />;
      case "image":
      case "file":
        return <MediaField kind={field.type} value={value ? [String(value)] : []} onChange={(ids) => set(field.name, ids[0] ?? null)} known={media} />;
      case "gallery":
        return <MediaField kind="image" multiple value={value as string[]} onChange={(ids) => set(field.name, ids)} known={media} />;
      case "color":
        return (
          <div className="flex items-center gap-2">
            <input type="color" aria-label={`${field.label} picker`} className="h-9 w-11 cursor-pointer rounded-lg border border-[#d9dce5] bg-white p-1" value={String(value || "#000000")} onChange={(e) => set(field.name, e.target.value)} />
            <input {...common} className="a-input font-mono" value={String(value ?? "")} onChange={(e) => set(field.name, e.target.value)} />
          </div>
        );
      default: {
        const type = { number: "number", date: "date", datetime: "datetime-local", email: "email", password: "password" }[field.type as string] ?? "text";
        return <input {...common} type={type} className="a-input" maxLength={field.max} placeholder={field.placeholder} value={String(value ?? "")} onChange={(e) => set(field.name, e.target.value)} />;
      }
    }
  };

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit((buttons.find((b) => b.primary) ?? buttons[0]).intent);
      }}
      className={aside ? "grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]" : ""}
    >
      <div className="space-y-5">
        {groups.map((group) => (
          <fieldset key={group} className="a-card p-5">
            {group && <legend className="float-left mb-4 w-full text-sm font-semibold">{group}</legend>}
            <div className="clear-both grid gap-x-5 gap-y-4 sm:grid-cols-2">
              {fields.filter((f) => (f.group ?? "") === group).map((field) => {
                const id = `${uid}-${field.name}`;
                const inline = field.type === "checkbox";
                return (
                  <div key={field.name} className={`${field.half ? "" : "sm:col-span-2"} ${inline ? "flex items-center justify-between gap-4 rounded-[10px] border border-[#e6e8ef] px-3 py-2.5" : ""}`}>
                    <label htmlFor={id} className={inline ? "text-[13px] font-medium text-[#30364a]" : "a-label"}>
                      {field.label}
                      {field.required && <span className="text-red-600" aria-hidden> *</span>}
                    </label>
                    {control(field)}
                    {!inline && field.help && !errors[field.name] && <p id={`${id}-help`} className="a-help">{field.help}</p>}
                    {errors[field.name] && <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-red-600">{errors[field.name]}</p>}
                  </div>
                );
              })}
            </div>
          </fieldset>
        ))}

        <div className="sticky bottom-3 z-10 flex flex-wrap items-center gap-2 rounded-2xl border border-[#e6e8ef] bg-white/95 p-3 shadow-lg backdrop-blur">
          {buttons.map((b) => (
            <button key={b.intent} type="button" className={`a-btn ${b.primary ? "a-btn-primary" : ""}`} disabled={pending} onClick={() => submit(b.intent)}>
              {pending && intent === b.intent && <Spinner />}
              {b.label}
            </button>
          ))}
          {extraActions}
          <span className="ml-auto text-xs text-gray-500" aria-live="polite">{dirty ? "Unsaved changes" : "All changes saved"}</span>
        </div>
      </div>
      {aside && <aside className="space-y-5 xl:sticky xl:top-20 xl:self-start">{aside(values)}</aside>}
    </form>
  );
}
