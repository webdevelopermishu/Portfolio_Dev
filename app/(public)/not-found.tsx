import Link from "next/link";

export const metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-sm text-muted">Error 404</p>
      <h1 className="display mt-4 text-[clamp(2.8rem,8vw,5.5rem)]">Page not found</h1>
      <p className="mt-5 max-w-md text-muted">The page you are looking for has moved or no longer exists.</p>
      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <Link href="/" className="rounded-full bg-ink px-6 py-3 text-[13px] font-semibold text-panel">Back to home</Link>
        <Link href="/projects" className="rounded-full border border-ink/60 px-6 py-3 text-[13px] font-semibold">View projects</Link>
      </div>
    </div>
  );
}
