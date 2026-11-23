import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const BOT = /bot|crawl|spider|slurp|preview|lighthouse|headless|monitor|curl|wget/i;

/** Anonymous page-view counter. Stores a daily-rotating hash instead of the IP address. */
export async function POST(request: Request) {
  try {
    const ua = request.headers.get("user-agent") ?? "";
    const ip = await clientIp();
    if (BOT.test(ua) || !rateLimit(`track:${ip}`, 60, 60_000).ok) return new NextResponse(null, { status: 204 });
    const body = (await request.json()) as { path?: unknown; referrer?: unknown };
    const path = typeof body.path === "string" ? body.path.slice(0, 200) : "";
    if (!path.startsWith("/") || path.startsWith("/admin") || path.startsWith("/preview")) return new NextResponse(null, { status: 204 });
    const settings = await db.siteSettings.findUnique({ where: { id: 1 }, select: { analyticsEnabled: true } });
    if (!settings?.analyticsEnabled) return new NextResponse(null, { status: 204 });
    let referrer = "";
    if (typeof body.referrer === "string" && body.referrer) {
      try {
        const host = new URL(body.referrer).hostname;
        if (host !== new URL(request.url).hostname) referrer = host.slice(0, 100);
      } catch {
        /* ignore malformed referrers */
      }
    }
    const day = new Date().toISOString().slice(0, 10);
    const visitor = createHash("sha256").update(`${ip}|${ua}|${day}|${process.env.AUTH_SECRET ?? ""}`).digest("hex").slice(0, 24);
    await db.analyticsEvent.create({ data: { path, referrer, visitor } });
  } catch {
    /* analytics must never break the page */
  }
  return new NextResponse(null, { status: 204 });
}
