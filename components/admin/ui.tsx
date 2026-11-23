"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, CircleCheck, LoaderCircle, X } from "lucide-react";
import type { ActionResult } from "@/lib/validation/fields";

// ── Toasts ──────────────────────────────────────────────────────────────────

type Toast = { id: number; kind: "success" | "error"; text: string };
const ToastContext = createContext<(kind: Toast["kind"], text: string) => void>(() => undefined);
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast["kind"], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((list) => [...list.slice(-3), { id, kind, text }]);
    window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), kind === "error" ? 7000 : 3500);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(92vw,360px)] flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} role={t.kind === "error" ? "alert" : "status"} className="pointer-events-auto flex animate-[rise_0.3s_ease] items-start gap-2.5 rounded-xl border border-[#e6e8ef] bg-white p-3.5 text-sm shadow-lg">
            {t.kind === "success" ? <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden /> : <CircleAlert className="mt-0.5 size-4 shrink-0 text-red-600" aria-hidden />}
            <span className="flex-1">{t.text}</span>
            <button type="button" aria-label="Dismiss" onClick={() => setToasts((list) => list.filter((x) => x.id !== t.id))}>
              <X className="size-4 text-gray-400" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Runs a server action with a pending flag, a toast for the outcome, and a data refresh. */
export function useAction() {
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = useCallback(
    (action: () => Promise<ActionResult>, after?: (result: ActionResult) => void) =>
      start(async () => {
        let result: ActionResult;
        try {
          result = await action();
        } catch {
          result = { ok: false, error: "The request failed. Check your connection and try again." };
        }
        if (result.ok) {
          if (result.message) toast("success", result.message);
          router.refresh();
        } else toast("error", result.error);
        after?.(result);
      }),
    [router, toast],
  );
  return { pending, run };
}

// ── Buttons ─────────────────────────────────────────────────────────────────

export function Spinner() {
  return <LoaderCircle className="size-4 animate-spin" aria-hidden />;
}

type ActionProps = {
  action: () => Promise<ActionResult>;
  children: React.ReactNode;
  className?: string;
  label?: string;
  redirectTo?: string;
};

/** A button bound to a server action. */
export function ActionButton({ action, children, className = "a-btn", label, redirectTo }: ActionProps) {
  const { pending, run } = useAction();
  const router = useRouter();
  return (
    <button type="button" className={className} aria-label={label} title={label} disabled={pending} onClick={() => run(action, (r) => r.ok && redirectTo && router.push(redirectTo))}>
      {pending ? <Spinner /> : children}
    </button>
  );
}

/** Like ActionButton, but asks for confirmation in an accessible dialog first. */
export function ConfirmButton({
  action, children, className = "a-btn a-btn-danger", label, title, description, confirmLabel = "Delete", redirectTo,
}: ActionProps & { title: string; description?: string; confirmLabel?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const { pending, run } = useAction();
  const router = useRouter();
  return (
    <>
      <button type="button" className={className} aria-label={label} title={label} onClick={() => ref.current?.showModal()}>
        {children}
      </button>
      <dialog ref={ref} className="m-auto w-[min(92vw,420px)] rounded-2xl p-0 backdrop:bg-black/40 open:animate-[rise_0.25s_ease]" onClick={(e) => e.target === e.currentTarget && ref.current?.close()}>
        <div className="p-6">
          <h2 className="text-base font-semibold">{title}</h2>
          {description && <p className="mt-2 text-sm text-gray-600">{description}</p>}
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" className="a-btn" onClick={() => ref.current?.close()}>Cancel</button>
            <button
              type="button"
              className="a-btn border-red-600 bg-red-600 text-white hover:bg-red-700"
              disabled={pending}
              onClick={() =>
                run(action, (r) => {
                  ref.current?.close();
                  if (r.ok && redirectTo) router.push(redirectTo);
                })
              }
            >
              {pending && <Spinner />}
              {confirmLabel}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}

/** Accessible on/off switch. */
export function Switch({ checked, onChange, label, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; id?: string }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${checked ? "bg-[#0f1524]" : "bg-gray-300"}`}
    >
      <span className={`inline-block size-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[22px]" : "translate-x-0.5"}`} />
    </button>
  );
}

/** Warns before leaving the page with unsaved changes. */
export function useUnsavedWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
}
