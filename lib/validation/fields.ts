import "server-only";
import { z } from "zod";
import type { Field } from "@/lib/fields";
import { sanitizeRichText } from "@/lib/sanitize";

const LINK = /^(https?:\/\/|mailto:|tel:|#|\/(?!\/))/i;

function fieldSchema(field: Field): z.ZodType {
  const max = field.max ?? (field.type === "textarea" ? 5000 : 300);
  switch (field.type) {
    case "checkbox":
      return z.coerce.boolean();
    case "number":
      return z.coerce.number().int().min(-100000).max(100000);
    case "image":
    case "file":
      return z.string().min(1).max(40).nullable().catch(null);
    case "gallery":
      return z.array(z.string().min(1).max(40)).max(40);
    case "list":
      return z.array(z.string().trim().min(1).max(200)).max(60);
    case "rich":
      return z.string().max(60000).transform(sanitizeRichText);
    case "date":
    case "datetime":
      return z
        .string()
        .trim()
        .transform((v) => (v ? new Date(v) : null))
        .refine((d) => d === null || !Number.isNaN(d.getTime()), "Enter a valid date");
    case "email":
      return field.required ? z.string().trim().toLowerCase().email().max(200) : z.union([z.literal(""), z.string().trim().toLowerCase().email().max(200)]);
    case "url": {
      const url = z.string().trim().max(500).regex(LINK, "Enter a full URL (https://…), a path (/page) or an anchor (#section)");
      return field.required ? url : z.union([z.literal(""), url]);
    }
    case "color":
      return z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex colour");
    case "select": {
      const values = (field.options ?? []).map((o) => o.value);
      return z.string().refine((v) => values.includes(v), "Choose one of the options");
    }
    default: {
      const text = z.string().trim().max(max, `Keep this under ${max} characters`);
      return field.required ? text.min(1, "This field is required") : text;
    }
  }
}

/** Builds a strict Zod object from field definitions; unknown keys are dropped. */
export function schemaFromFields(fields: Field[]) {
  return z.object(Object.fromEntries(fields.map((field) => [field.name, fieldSchema(field)])));
}

export type ActionResult<T = unknown> =
  | { ok: true; message?: string; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export function zodFailure(error: z.ZodError): ActionResult {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
}
