import { useId } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { safeHref } from "@/lib/utils";

/** Dark circular badge with text rotating around an arrow. */
export function CircularBadge({ text, href, size = 92, className = "" }: { text: string; href: string; size?: number; className?: string }) {
  const id = `badge${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const phrase = `${text} `.repeat(text.length > 14 ? 1 : 2).trim();
  return (
    <Link
      href={safeHref(href)}
      aria-label={text}
      data-cursor
      className={`group relative inline-flex shrink-0 items-center justify-center rounded-full bg-ink text-panel transition-transform duration-500 ease-premium hover:scale-105 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full animate-spin-slow" aria-hidden>
        <defs>
          <path id={id} d="M50,50 m-36,0 a36,36 0 1,1 72,0 a36,36 0 1,1 -72,0" />
        </defs>
        <text fill="currentColor" fontSize="12.5" fontWeight="500" letterSpacing="1.2">
          <textPath href={`#${id}`} textLength="218">
            {phrase}
          </textPath>
        </text>
      </svg>
      <ArrowUpRight className="size-6 transition-transform duration-500 ease-premium group-hover:rotate-45" strokeWidth={1.5} aria-hidden />
    </Link>
  );
}
