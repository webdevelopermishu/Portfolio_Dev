"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUpRight, ChevronDown, CircleCheck, LoaderCircle } from "lucide-react";
import { submitContact } from "@/lib/actions/contact";
import { contactSchema, type ContactInput } from "@/lib/validation/schemas";
import type { ContactContent } from "@/types/content";

const field = "peer w-full border-b border-ink/15 bg-transparent py-3.5 text-[15px] text-ink outline-none transition-colors duration-300 placeholder:text-ink/75 focus:border-ink aria-[invalid=true]:border-red-600";

export function ContactForm({ config }: { config: ContactContent }) {
  const renderedAt = useRef(Date.now());
  const [done, setDone] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", phone: "", budget: "", projectType: "", message: "", website: "", elapsed: 0 },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const result = await submitContact({ ...values, elapsed: Date.now() - renderedAt.current });
    if (result.ok) {
      setDone(result.message ?? "Thank you — your message has been sent.");
      reset();
      return;
    }
    for (const [key, message] of Object.entries(result.fieldErrors ?? {})) setError(key as keyof ContactInput, { message });
    setServerError(result.error);
  });

  if (done) {
    return (
      <div role="status" className="mt-8 rounded-2xl border border-line bg-panel p-8">
        <CircleCheck className="size-8" strokeWidth={1.5} aria-hidden />
        <p className="mt-4 text-lg font-medium">{done}</p>
        <button
          type="button"
          className="mt-5 text-sm underline underline-offset-4"
          onClick={() => {
            renderedAt.current = Date.now();
            setDone(null);
          }}
        >
          Send another message
        </button>
      </div>
    );
  }

  const error = (name: keyof ContactInput) =>
    errors[name]?.message ? (
      <p id={`contact-${name}-error`} role="alert" className="mt-1.5 text-xs text-red-700">
        {errors[name]?.message}
      </p>
    ) : null;
  const aria = (name: keyof ContactInput) => ({
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `contact-${name}-error` : undefined,
  });

  return (
    <form onSubmit={onSubmit} noValidate className="mt-4">
      {/* Honeypot: hidden from people and assistive technology; bots tend to fill it in. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
        </label>
      </div>

      <div>
        <label htmlFor="contact-name" className="sr-only">{config.nameLabel}</label>
        <input id="contact-name" type="text" autoComplete="name" placeholder={config.nameLabel} className={field} {...aria("name")} {...register("name")} />
        {error("name")}
      </div>
      <div className={config.showPhone ? "grid gap-x-8 sm:grid-cols-2" : ""}>
        <div>
          <label htmlFor="contact-email" className="sr-only">{config.emailLabel}</label>
          <input id="contact-email" type="email" autoComplete="email" inputMode="email" placeholder={config.emailLabel} className={field} {...aria("email")} {...register("email")} />
          {error("email")}
        </div>
        {config.showPhone && (
          <div>
            <label htmlFor="contact-phone" className="sr-only">{config.phoneLabel}</label>
            <input id="contact-phone" type="tel" autoComplete="tel" placeholder={config.phoneLabel} className={field} {...aria("phone")} {...register("phone")} />
            {error("phone")}
          </div>
        )}
      </div>
      {(config.showBudget || config.showProjectType) && (
        <div className={config.showBudget && config.showProjectType ? "grid gap-x-8 sm:grid-cols-2" : ""}>
          {config.showBudget && config.budgetOptions.length > 0 && (
            <div className="relative">
              <label htmlFor="contact-budget" className="sr-only">{config.budgetLabel}</label>
              <select id="contact-budget" className={`${field} appearance-none pr-8`} {...register("budget")}>
                <option value="">{config.budgetLabel}</option>
                {config.budgetOptions.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-1 top-4 size-4" aria-hidden />
            </div>
          )}
          {config.showProjectType && config.projectTypes.length > 0 && (
            <div className="relative">
              <label htmlFor="contact-type" className="sr-only">{config.typeLabel}</label>
              <select id="contact-type" className={`${field} appearance-none pr-8`} {...register("projectType")}>
                <option value="">{config.typeLabel}</option>
                {config.projectTypes.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-1 top-4 size-4" aria-hidden />
            </div>
          )}
        </div>
      )}
      <div>
        <label htmlFor="contact-message" className="sr-only">{config.detailsLabel}</label>
        <textarea id="contact-message" rows={2} placeholder={config.detailsLabel} className={`${field} min-h-[52px] resize-y`} {...aria("message")} {...register("message")} />
        {error("message")}
      </div>

      {serverError && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {serverError}
        </p>
      )}

      <button type="submit" disabled={isSubmitting} data-cursor className="group mt-7 inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-xs font-semibold text-panel transition-opacity disabled:opacity-60">
        {isSubmitting ? "Sending…" : config.ctaText}
        {isSubmitting ? <LoaderCircle className="size-3.5 animate-spin" aria-hidden /> : <ArrowUpRight className="size-3.5 transition-transform duration-500 ease-premium group-hover:rotate-45" strokeWidth={2} aria-hidden />}
      </button>
    </form>
  );
}
