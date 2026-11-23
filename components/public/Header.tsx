"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { SmartImage } from "@/components/shared/SmartImage";
import { Magnetic } from "@/components/public/motion";
import { safeHref } from "@/lib/utils";

type Props = {
  logoText: string;
  logo: { url: string; alt: string; width: number | null; height: number | null } | null;
  nav: { id: string; label: string; href: string }[];
  cta: { label: string; href: string };
};

export function Header({ logoText, logo, nav, cta }: Props) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <header className="enter-fade relative z-40 px-5 sm:px-10 lg:px-20">
      <div className="flex h-[68px] items-center justify-between border-b border-line">
        <Link href="/" className="display text-[28px] leading-none sm:text-[30px]" aria-label={`${logoText} — home`}>
          {logo ? (
            <SmartImage src={logo.url} alt={logo.alt || logoText} width={logo.width ?? 140} height={logo.height ?? 36} className="h-8 w-auto" priority />
          ) : (
            logoText
          )}
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-7 text-[13px] text-ink/80">
            {nav.map((item) => (
              <li key={item.id}>
                <Link href={safeHref(item.href)} className="relative py-2 transition-colors hover:text-ink after:absolute after:inset-x-0 after:bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-ink after:transition-transform after:duration-500 after:ease-premium hover:after:scale-x-100">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {cta.label && (
            <Magnetic className="hidden sm:inline-block">
              <Link href={safeHref(cta.href)} data-cursor className="group inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-[13px] font-semibold text-panel transition-shadow duration-300 hover:shadow-[0_8px_24px_-8px_rgb(15_21_36/0.6)]">
                {cta.label}
                <ArrowUpRight className="size-4 transition-transform duration-500 ease-premium group-hover:rotate-45" strokeWidth={2} aria-hidden />
              </Link>
            </Magnetic>
          )}
          <button type="button" className="inline-flex size-10 items-center justify-center rounded-full border border-line md:hidden" aria-label="Open menu" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
            <Menu className="size-5" strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      </div>

      <dialog
        ref={dialogRef}
        aria-label="Menu"
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        className="m-0 h-dvh max-h-none w-full max-w-none bg-panel p-0 text-ink backdrop:bg-ink/30 open:animate-[fade_0.25s_ease]"
      >
        <div className="flex h-full flex-col px-5 pb-8">
          <div className="flex h-[68px] items-center justify-between border-b border-line">
            <span className="display text-[28px] leading-none">{logoText}</span>
            <button type="button" className="inline-flex size-10 items-center justify-center rounded-full border border-line" aria-label="Close menu" onClick={() => setOpen(false)}>
              <X className="size-5" strokeWidth={1.75} aria-hidden />
            </button>
          </div>
          <nav aria-label="Mobile" className="mt-8 flex-1">
            <ul className="space-y-1">
              {nav.map((item, i) => (
                <li key={item.id} className="enter" style={{ "--i": i } as React.CSSProperties}>
                  <Link href={safeHref(item.href)} onClick={() => setOpen(false)} className="display block border-b border-line py-4 text-4xl">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          {cta.label && (
            <Link href={safeHref(cta.href)} onClick={() => setOpen(false)} className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-4 text-sm font-semibold text-panel">
              {cta.label}
              <ArrowUpRight className="size-4" aria-hidden />
            </Link>
          )}
        </div>
      </dialog>
    </header>
  );
}
