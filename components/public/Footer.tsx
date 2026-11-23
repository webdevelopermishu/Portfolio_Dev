import Link from "next/link";
import { Download } from "lucide-react";
import type { SiteData } from "@/lib/services/content";
import { safeHref } from "@/lib/utils";

export function Footer({ data }: { data: SiteData }) {
  const { settings, socials } = data;
  const links = socials.filter((s) => s.showInFooter);
  const copyright = settings.footerText.replace(/\{year\}/g, String(new Date().getFullYear()));
  return (
    <footer className="px-5 pb-8 pt-10 sm:px-10 lg:px-20 lg:pt-12">
      <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-8">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <Link href="/" className="display text-[30px] leading-none">{settings.logoText}</Link>
          {settings.cv && (
            <a href={settings.cv.url} download className="group inline-flex items-center gap-3 text-sm font-medium">
              <span className="inline-flex size-9 items-center justify-center rounded-full bg-ink text-panel transition-transform duration-500 ease-premium group-hover:translate-y-0.5">
                <Download className="size-4" strokeWidth={1.75} aria-hidden />
              </span>
              {settings.cvLabel || "Download CV"}
            </a>
          )}
        </div>
        {links.length > 0 && (
          <ul className="flex flex-wrap gap-x-8 gap-y-2">
            {links.map((s) => (
              <li key={s.id} className="flex items-center gap-2">
                <span aria-hidden className="size-2.5 rounded-full bg-ink" />
                <a href={safeHref(s.url)} target="_blank" rel="noopener noreferrer me" className="display text-[30px] underline decoration-1 underline-offset-[6px] transition-opacity hover:opacity-60 lg:text-[42px]">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
      {(copyright || settings.footerCredit) && (
        <div className="mt-10 flex flex-wrap justify-between gap-2 border-t border-line pt-6 text-xs text-muted">
          <p>{copyright}</p>
          {settings.footerCredit && <p>{settings.footerCredit}</p>}
        </div>
      )}
    </footer>
  );
}
