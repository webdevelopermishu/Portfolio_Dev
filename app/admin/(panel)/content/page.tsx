import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowUp, Eye, EyeOff } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { moveSection, setSectionVisible } from "@/lib/actions/admin";
import { SECTION_DEFAULTS, SECTION_KEYS, SECTION_LABELS, type SectionKey, type Values } from "@/lib/fields";
import { mediaLookup } from "@/lib/services/admin";
import { SectionForm } from "@/components/admin/forms";
import { ListEditor } from "@/components/admin/ListEditor";
import { Badge, PageHeader } from "@/components/admin/table";
import { ActionButton } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Content" };

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ section?: string }> }) {
  await requireUser();
  const { section } = await searchParams;
  const active: SectionKey = (SECTION_KEYS as readonly string[]).includes(section ?? "") ? (section as SectionKey) : "hero";

  const page = await db.page.findUniqueOrThrow({ where: { slug: "home" }, include: { sections: { orderBy: { order: "asc" } } } });
  const rows = [...SECTION_KEYS]
    .map((key) => ({ key, row: page.sections.find((s) => s.key === key) }))
    .sort((a, b) => (a.row?.order ?? 99) - (b.row?.order ?? 99));
  const current = rows.find((r) => r.key === active)?.row;
  const initial = { ...SECTION_DEFAULTS[active], ...((current?.draft ?? current?.content ?? {}) as Values) };

  const [media, skills, stats] = await Promise.all([
    mediaLookup([initial.portraitId as string, initial.imageId as string]),
    active === "hero" ? db.skill.findMany({ orderBy: { order: "asc" } }) : [],
    active === "hero" || active === "about" ? db.statistic.findMany({ where: { group: active === "hero" ? "HERO" : "ABOUT" }, orderBy: { order: "asc" } }) : [],
  ]);

  return (
    <>
      <PageHeader title="Content" description="Edit each section of the home page. “Save draft” keeps changes private; “Publish” makes them live. Use the arrows to change the order sections appear in." />
      <div className="grid gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
        <nav aria-label="Sections" className="a-card h-fit p-2">
          <ul className="space-y-0.5">
            {rows.map(({ key, row }, index) => (
              <li key={key} className={`flex items-center gap-1 rounded-lg pr-1 ${key === active ? "bg-[#f3f4f8]" : ""}`}>
                <Link href={`?section=${key}`} aria-current={key === active ? "page" : undefined} className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-[13px] font-medium">
                  <span className="truncate">{SECTION_LABELS[key]}</span>
                  {row?.draft != null && <Badge status="NEW" label="Draft" />}
                  {row?.visible === false && <EyeOff className="size-3.5 shrink-0 text-gray-400" aria-label="Hidden" />}
                </Link>
                {index > 0 && <ActionButton action={moveSection.bind(null, key, "up")} className="rounded p-1 text-gray-500 hover:bg-white" label={`Move ${SECTION_LABELS[key]} up`}><ArrowUp className="size-3.5" aria-hidden /></ActionButton>}
                {index < rows.length - 1 && <ActionButton action={moveSection.bind(null, key, "down")} className="rounded p-1 text-gray-500 hover:bg-white" label={`Move ${SECTION_LABELS[key]} down`}><ArrowDown className="size-3.5" aria-hidden /></ActionButton>}
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-5">
          <div className="a-card flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <h2 className="text-sm font-semibold">{SECTION_LABELS[active]} section</h2>
              <p className="a-help">
                {current?.visible === false ? "Hidden from the public site." : "Visible on the public site."}
                {current?.draft != null && " You are editing an unpublished draft."}
              </p>
            </div>
            <ActionButton action={setSectionVisible.bind(null, active, current?.visible === false)} className="a-btn">
              {current?.visible === false ? <><Eye className="size-4" aria-hidden />Show section</> : <><EyeOff className="size-4" aria-hidden />Hide section</>}
            </ActionButton>
          </div>

          {/* The key remounts the form when switching sections or after a draft is discarded. */}
          <SectionForm key={`${active}-${current?.updatedAt.getTime()}`} sectionKey={active} hasDraft={current?.draft != null} initial={initial} media={media} />

          {active === "hero" && (
            <>
              <ListEditor kind="heroStat" title="Hero statistics" description="Shown at the top left of the hero. Numbers count up when they come into view." rows={stats} addLabel="Add statistic" />
              <ListEditor kind="skill" title="Skill tags" description="Visible tags appear in the hero and in your structured data. Six or fewer keeps the hero tidy." rows={skills} addLabel="Add skill" />
            </>
          )}
          {active === "about" && (
            <ListEditor kind="aboutStat" title="Achievement statistics" description="Only publish figures you can stand behind — the seeded values are samples." rows={stats} addLabel="Add statistic" />
          )}
          {active === "projects" && <p className="a-help">Projects themselves are managed under <Link href="/admin/projects" className="underline">Projects</Link>.</p>}
          {active === "clients" && <p className="a-help">Logos are managed under <Link href="/admin/clients" className="underline">Clients</Link>.</p>}
          {active === "testimonials" && <p className="a-help">Reviews are managed under <Link href="/admin/testimonials" className="underline">Testimonials</Link>.</p>}
          {active === "contact" && <p className="a-help">Email, phone, WhatsApp and location are edited in <Link href="/admin/settings" className="underline">Settings</Link>; social links in <Link href="/admin/navigation" className="underline">Navigation &amp; social</Link>.</p>}
        </div>
      </div>
    </>
  );
}
