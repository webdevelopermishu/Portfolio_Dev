"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2, ExternalLink, Eye, FileText, FolderKanban, Image as ImageIcon, Inbox, LayoutDashboard, LogOut, Menu,
  MessageSquareQuote, Navigation, Search, Settings, UserRound, Users, X,
} from "lucide-react";
import { logout } from "@/lib/actions/admin";

type Props = { user: { name: string; email: string; role: string }; newLeads: number; siteName: string; children: React.ReactNode };

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/content", label: "Content", icon: FileText },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { href: "/admin/clients", label: "Clients", icon: Building2 },
  { href: "/admin/leads", label: "Leads", icon: Inbox },
  { href: "/admin/media", label: "Media", icon: ImageIcon },
  { href: "/admin/navigation", label: "Navigation & social", icon: Navigation },
  { href: "/admin/seo", label: "SEO", icon: Search },
  { href: "/admin/settings", label: "Settings", icon: Settings, admin: true },
  { href: "/admin/users", label: "Users", icon: Users, admin: true },
  { href: "/admin/profile", label: "My profile", icon: UserRound },
];

export function AdminShell({ user, newLeads, siteName, children }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const items = NAV.filter((item) => !item.admin || user.role === "ADMIN");
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  const current = items.find((item) => isActive(item.href));

  const sidebar = (
    <nav aria-label="Dashboard" className="flex h-full flex-col">
      <Link href="/admin" className="flex h-14 items-center gap-2.5 border-b border-[#e6e8ef] px-5">
        <span className="inline-flex size-7 items-center justify-center rounded-lg bg-[#0f1524] text-xs font-bold text-white">{siteName.slice(0, 1).toUpperCase()}</span>
        <span className="truncate text-sm font-semibold">{siteName}</span>
      </Link>
      <ul className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {items.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${isActive(href) ? "bg-[#0f1524] text-white" : "text-[#30364a] hover:bg-[#f3f4f8]"}`}
            >
              <Icon className="size-4" aria-hidden />
              <span className="flex-1">{label}</span>
              {href === "/admin/leads" && newLeads > 0 && (
                <span className={`rounded-full px-1.5 text-[11px] font-semibold ${isActive(href) ? "bg-white text-[#0f1524]" : "bg-[#0f1524] text-white"}`} aria-label={`${newLeads} new`}>{newLeads}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
      <div className="border-t border-[#e6e8ef] p-3">
        <div className="px-3 pb-2">
          <p className="truncate text-[13px] font-medium">{user.name}</p>
          <p className="truncate text-xs text-gray-500">{user.email} · {user.role === "ADMIN" ? "Administrator" : "Editor"}</p>
        </div>
        <form action={logout}>
          <button type="submit" className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-[#30364a] hover:bg-[#f3f4f8]">
            <LogOut className="size-4" aria-hidden />
            Sign out
          </button>
        </form>
      </div>
    </nav>
  );

  return (
    <div className="min-h-dvh bg-[#f6f7fa] font-sans text-[#0f1524]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-[#e6e8ef] bg-white lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 animate-[fade_0.2s_ease] bg-white shadow-xl">{sidebar}</div>
          <button type="button" className="absolute right-3 top-3 rounded-full bg-white p-2" aria-label="Close menu" onClick={() => setOpen(false)}><X className="size-4" aria-hidden /></button>
        </div>
      )}
      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[#e6e8ef] bg-white/90 px-4 backdrop-blur sm:px-6">
          <button type="button" className="a-btn a-btn-icon lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}><Menu className="size-4" aria-hidden /></button>
          <p className="text-sm font-semibold">{current?.label ?? "Dashboard"}</p>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/preview" target="_blank" className="a-btn"><Eye className="size-4" aria-hidden /><span className="hidden sm:inline">Preview drafts</span></Link>
            <Link href="/" target="_blank" className="a-btn"><ExternalLink className="size-4" aria-hidden /><span className="hidden sm:inline">View site</span></Link>
          </div>
        </header>
        <main id="main" className="mx-auto max-w-[1200px] p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
