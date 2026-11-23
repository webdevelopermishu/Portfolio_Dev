export default function Loading() {
  return (
    <div role="status" aria-label="Loading" className="animate-pulse space-y-4">
      <div className="h-7 w-48 rounded-lg bg-gray-200" />
      <div className="h-4 w-80 max-w-full rounded bg-gray-200" />
      <div className="a-card h-72" />
    </div>
  );
}
