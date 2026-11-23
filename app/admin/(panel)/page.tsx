import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { livePublished } from "@/lib/services/content";
import { Badge, EmptyState, PageHeader } from "@/components/admin/table";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Overview" };

const DAYS = 14;

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requireUser();
  const { denied } = await searchParams;
  const since = new Date(Date.now() - (DAYS - 1) * 86_400_000);
  since.setUTCHours(0, 0, 0, 0);

  const [projects, liveProjects, testimonials, clients, leadsTotal, leadsNew, recentLeads, daily, topPages, topReferrers, drafts] = await Promise.all([
    db.project.count(),
    db.project.count({ where: livePublished() }),
    db.testimonial.count({ where: { status: "PUBLISHED" } }),
    db.client.count({ where: { visible: true } }),
    db.contactLead.count(),
    db.contactLead.count({ where: { status: "NEW" } }),
    db.contactLead.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    db.$queryRaw<{ day: Date; views: bigint; visitors: bigint }[]>`
      SELECT date_trunc('day', "createdAt") AS day, count(*) AS views, count(DISTINCT "visitor") AS visitors
      FROM "AnalyticsEvent" WHERE "type" = 'page_view' AND "createdAt" >= ${since} GROUP BY 1 ORDER BY 1`,
    db.analyticsEvent.groupBy({ by: ["path"], where: { createdAt: { gte: since } }, _count: { path: true }, orderBy: { _count: { path: "desc" } }, take: 6 }),
    db.analyticsEvent.groupBy({ by: ["referrer"], where: { createdAt: { gte: since }, referrer: { not: "" } }, _count: { referrer: true }, orderBy: { _count: { referrer: "desc" } }, take: 6 }),
    db.pageSection.count({ where: { draft: { not: Prisma.DbNull } } }),
  ]);

  const byDay = new Map(daily.map((d) => [d.day.toISOString().slice(0, 10), { views: Number(d.views), visitors: Number(d.visitors) }]));
  const series = Array.from({ length: DAYS }, (_, i) => {
    const date = new Date(since.getTime() + i * 86_400_000);
    const key = date.toISOString().slice(0, 10);
    return { key, label: formatDate(date, { month: "short", day: "numeric" }), ...(byDay.get(key) ?? { views: 0, visitors: 0 }) };
  });
  const totalViews = series.reduce((sum, d) => sum + d.views, 0);
  const totalVisitors = series.reduce((sum, d) => sum + d.visitors, 0);
  const peak = Math.max(1, ...series.map((d) => d.views));

  const cards = [
    { label: "Page views (14 days)", value: totalViews, href: "#traffic" },
    { label: "Daily visitors (14 days)", value: totalVisitors, href: "#traffic" },
    { label: "New leads", value: leadsNew, sub: `${leadsTotal} in total`, href: "/admin/leads?status=NEW" },
    { label: "Live projects", value: liveProjects, sub: `${projects - liveProjects} not public`, href: "/admin/projects" },
    { label: "Published testimonials", value: testimonials, href: "/admin/testimonials" },
    { label: "Visible client logos", value: clients, href: "/admin/clients" },
  ];

  return (
    <>
      <PageHeader title={`Welcome back, ${user.name.split(" ")[0]}`} description="A snapshot of your site's content, traffic and inquiries.">
        <Link href="/admin/projects/new" className="a-btn a-btn-primary">New project</Link>
      </PageHeader>

      {denied && <p role="alert" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">That area is limited to administrators.</p>}
      {drafts > 0 && (
        <p className="mb-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          {drafts} section{drafts === 1 ? " has" : "s have"} unpublished draft changes. <Link href="/admin/content" className="underline">Review in Content</Link>
        </p>
      )}

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {cards.map((card) => (
          <li key={card.label}>
            <Link href={card.href} className="a-card block p-4 transition-shadow hover:shadow-md">
              <p className="text-xs text-gray-500">{card.label}</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">{card.value.toLocaleString("en")}</p>
              {card.sub && <p className="mt-1 text-xs text-gray-500">{card.sub}</p>}
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section id="traffic" className="a-card p-5" aria-labelledby="traffic-heading">
          <h2 id="traffic-heading" className="text-sm font-semibold">Page views — last {DAYS} days</h2>
          {totalViews === 0 ? (
            <EmptyState title="No visits recorded yet" description="Views appear here once people open the public site. Tracking is anonymous and can be switched off in Settings." />
          ) : (
            <>
              <ol className="mt-6 flex h-44 items-end gap-1.5" aria-label="Daily page views">
                {series.map((d) => (
                  <li key={d.key} className="group relative flex h-full flex-1 flex-col justify-end" title={`${d.label}: ${d.views} views, ${d.visitors} visitors`}>
                    <span className="sr-only">{d.label}: {d.views} views</span>
                    <span aria-hidden className="block rounded-t-md bg-[#0f1524] transition-opacity group-hover:opacity-70" style={{ height: `${Math.max(2, (d.views / peak) * 100)}%` }} />
                  </li>
                ))}
              </ol>
              <div className="mt-2 flex justify-between text-[11px] text-gray-500"><span>{series[0].label}</span><span>{series[DAYS - 1].label}</span></div>
            </>
          )}
        </section>

        <section className="a-card p-5" aria-labelledby="top-heading">
          <h2 id="top-heading" className="text-sm font-semibold">Top pages</h2>
          {topPages.length === 0 ? <p className="mt-4 text-sm text-gray-500">No data yet.</p> : (
            <ul className="mt-3 divide-y divide-[#eef0f5] text-[13px]">
              {topPages.map((p) => <li key={p.path} className="flex justify-between gap-4 py-2"><span className="truncate">{p.path}</span><span className="font-medium">{p._count.path}</span></li>)}
            </ul>
          )}
          <h2 className="mt-6 text-sm font-semibold">Top referrers</h2>
          {topReferrers.length === 0 ? <p className="mt-4 text-sm text-gray-500">No external referrers yet.</p> : (
            <ul className="mt-3 divide-y divide-[#eef0f5] text-[13px]">
              {topReferrers.map((r) => <li key={r.referrer} className="flex justify-between gap-4 py-2"><span className="truncate">{r.referrer}</span><span className="font-medium">{r._count.referrer}</span></li>)}
            </ul>
          )}
        </section>
      </div>

      <section className="a-card mt-5 overflow-hidden" aria-labelledby="leads-heading">
        <div className="flex items-center justify-between p-5 pb-3">
          <h2 id="leads-heading" className="text-sm font-semibold">Recent inquiries</h2>
          <Link href="/admin/leads" className="text-[13px] underline underline-offset-2">View all</Link>
        </div>
        {recentLeads.length === 0 ? (
          <EmptyState title="No inquiries yet" description="Messages sent through the contact form will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="a-table">
              <thead><tr><th>Name</th><th>Project type</th><th>Budget</th><th>Status</th><th>Received</th></tr></thead>
              <tbody>
                {recentLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td><Link href={`/admin/leads/${lead.id}`} className="font-medium underline-offset-2 hover:underline">{lead.name}</Link><div className="text-xs text-gray-500">{lead.email}</div></td>
                    <td>{lead.projectType || "—"}</td>
                    <td>{lead.budget || "—"}</td>
                    <td><Badge status={lead.status} /></td>
                    <td className="whitespace-nowrap text-gray-600">{formatDate(lead.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
