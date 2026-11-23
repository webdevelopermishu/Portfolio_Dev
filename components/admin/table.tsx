import Link from "next/link";
import { Search } from "lucide-react";

export function PageHeader({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-gray-600">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

const BADGES: Record<string, string> = {
  PUBLISHED: "bg-emerald-50 text-emerald-700", DRAFT: "bg-gray-100 text-gray-600", SCHEDULED: "bg-sky-50 text-sky-700",
  NEW: "bg-amber-50 text-amber-700", CONTACTED: "bg-sky-50 text-sky-700", QUALIFIED: "bg-violet-50 text-violet-700",
  CLOSED: "bg-gray-100 text-gray-600", VISIBLE: "bg-emerald-50 text-emerald-700", HIDDEN: "bg-gray-100 text-gray-600",
  FEATURED: "bg-amber-50 text-amber-700", ADMIN: "bg-violet-50 text-violet-700", EDITOR: "bg-gray-100 text-gray-600",
};
export function Badge({ status, label }: { status: string; label?: string }) {
  return <span className={`a-badge ${BADGES[status] ?? "bg-gray-100 text-gray-600"}`}>{label ?? status.charAt(0) + status.slice(1).toLowerCase()}</span>;
}

/** GET form: search and filters live in the URL so they survive reloads and can be shared. */
export function Filters({
  q, placeholder = "Search…", selects = [],
}: { q?: string; placeholder?: string; selects?: { name: string; label: string; value?: string; options: { value: string; label: string }[] }[] }) {
  return (
    <form method="get" className="mb-4 flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-gray-400" aria-hidden />
        <input name="q" defaultValue={q} placeholder={placeholder} aria-label="Search" className="a-input w-60 pl-8" />
      </div>
      {selects.map((s) => (
        <select key={s.name} name={s.name} defaultValue={s.value ?? ""} aria-label={s.label} className="a-input w-auto">
          <option value="">{s.label}: all</option>
          {s.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ))}
      <button type="submit" className="a-btn">Apply</button>
      {(q || selects.some((s) => s.value)) && <Link href="?" className="text-xs text-gray-500 underline underline-offset-2">Clear</Link>}
    </form>
  );
}

export function Pagination({ page, pageSize, total, params }: { page: number; pageSize: number; total: number; params: Record<string, string | undefined> }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    if (p > 1) sp.set("page", String(p));
    return `?${sp.toString()}`;
  };
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3 border-t border-[#eef0f5] px-4 py-3 text-[13px] text-gray-600">
      <span>
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
      </span>
      <div className="flex items-center gap-2">
        {page > 1 ? <Link href={href(page - 1)} className="a-btn">Previous</Link> : <span className="a-btn opacity-50" aria-disabled>Previous</span>}
        <span>Page {page} of {pages}</span>
        {page < pages ? <Link href={href(page + 1)} className="a-btn">Next</Link> : <span className="a-btn opacity-50" aria-disabled>Next</span>}
      </div>
    </nav>
  );
}

export function EmptyState({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <p className="text-sm font-semibold">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

export function pageParam(value: string | undefined) {
  return Math.max(1, Number.parseInt(value ?? "1", 10) || 1);
}
