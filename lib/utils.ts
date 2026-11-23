export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function slugify(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
}

export function absoluteUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function formatDate(date: Date | string | null | undefined, opts?: Intl.DateTimeFormatOptions) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en", opts ?? { year: "numeric", month: "short", day: "numeric" }).format(
    new Date(date),
  );
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Only allow http(s), mailto, tel, in-page anchors and site-relative links. */
export function safeHref(href: string | null | undefined, fallback = "#") {
  const value = (href ?? "").trim();
  if (!value) return fallback;
  if (/^(https?:\/\/|mailto:|tel:|#|\/(?!\/))/i.test(value)) return value;
  return fallback;
}

export function isExternal(href: string) {
  return /^https?:\/\//i.test(href);
}
