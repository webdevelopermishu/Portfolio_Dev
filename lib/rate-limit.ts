import { createHash } from "node:crypto";
import { headers } from "next/headers";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/**
 * Fixed-window in-memory limiter. Suitable for a single Node.js instance; the contact
 * form additionally enforces a database-backed limit that holds across instances.
 */
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k);
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  bucket.count += 1;
  return { ok: bucket.count <= limit, remaining: Math.max(0, limit - bucket.count) };
}

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

/** One-way hash so raw IP addresses are never stored. */
export function hashIp(ip: string) {
  return createHash("sha256")
    .update(`${ip}:${process.env.AUTH_SECRET ?? ""}`)
    .digest("hex")
    .slice(0, 32);
}
