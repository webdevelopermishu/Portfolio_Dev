import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <h1 className="display text-6xl">Page not found</h1>
      <Link href="/" className="mt-8 rounded-full bg-ink px-6 py-3 text-[13px] font-semibold text-panel">Back to home</Link>
    </main>
  );
}
