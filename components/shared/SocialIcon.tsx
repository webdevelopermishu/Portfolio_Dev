import { Globe } from "lucide-react";

const MONOGRAMS: Record<string, string> = {
  github: "GH", linkedin: "in", x: "X", dribbble: "Dr", behance: "Bē", instagram: "IG", facebook: "f", youtube: "YT", whatsapp: "WA",
};

/** Compact monogram badges (brand marks are trademarks, so they are not redrawn here). */
export function SocialIcon({ platform, className = "" }: { platform: string; className?: string }) {
  const mono = MONOGRAMS[platform];
  return (
    <span aria-hidden className={`inline-flex size-9 items-center justify-center rounded-full border border-line text-[11px] font-semibold tracking-tight ${className}`}>
      {mono ?? <Globe className="size-4" strokeWidth={1.75} />}
    </span>
  );
}
