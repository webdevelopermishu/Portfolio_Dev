"use client";

export default function PanelError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="a-card mx-auto mt-10 max-w-md p-8 text-center">
      <h1 className="text-base font-semibold">This page could not be loaded</h1>
      <p className="mt-2 text-sm text-gray-600">An unexpected error occurred. Try again, and check the server log if it keeps happening.</p>
      {error.digest && <p className="mt-2 font-mono text-xs text-gray-400">Reference: {error.digest}</p>}
      <button type="button" className="a-btn a-btn-primary mt-5" onClick={reset}>Try again</button>
    </div>
  );
}
