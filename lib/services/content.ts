import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { SECTION_DEFAULTS, SECTION_KEYS, type SectionKey, type Values } from "@/lib/fields";
import type { MediaRef, SectionContentMap } from "@/types/content";

export const mediaSelect = { id: true, url: true, alt: true, width: true, height: true, mime: true, filename: true } as const;

/** Published and, if scheduled, already due. */
export function livePublished() {
  return { status: "PUBLISHED" as const, OR: [{ publishAt: null }, { publishAt: { lte: new Date() } }] };
}

const projectCardSelect = {
  id: true, title: true, slug: true, category: true, shortDescription: true, featured: true, status: true,
  featuredImage: { select: mediaSelect },
} as const;

export class NotInitialisedError extends Error {
  constructor() {
    super("The site has no content yet. Run `npm run db:migrate` and `npm run db:seed` first.");
  }
}

/**
 * Everything the public layout and home page need. `preview` swaps in unpublished
 * section drafts and unpublished entities; callers must authorise it first.
 */
export const getSiteData = cache(async (preview = false) => {
  const [settings, page, nav, socials, skills, stats, clients, testimonials] = await Promise.all([
    db.siteSettings.findUnique({
      where: { id: 1 },
      include: {
        logo: { select: mediaSelect }, favicon: { select: mediaSelect },
        profileImage: { select: mediaSelect }, cv: { select: mediaSelect },
      },
    }),
    db.page.findUnique({
      where: { slug: "home" },
      include: { sections: true, seo: { include: { ogImage: { select: mediaSelect } } } },
    }),
    db.navItem.findMany({ where: { visible: true }, orderBy: { order: "asc" } }),
    db.socialLink.findMany({ where: { visible: true }, orderBy: { order: "asc" } }),
    db.skill.findMany({ where: { visible: true }, orderBy: { order: "asc" } }),
    db.statistic.findMany({ where: { visible: true }, orderBy: { order: "asc" } }),
    db.client.findMany({ where: { visible: true }, orderBy: { order: "asc" }, include: { logo: { select: mediaSelect } } }),
    db.testimonial.findMany({
      where: preview ? {} : { status: "PUBLISHED" },
      orderBy: [{ featured: "desc" }, { order: "asc" }, { createdAt: "desc" }],
      include: { avatar: { select: mediaSelect }, companyLogo: { select: mediaSelect } },
    }),
  ]);
  if (!settings || !page || !page.seo) throw new NotInitialisedError();

  const sections = {} as { [K in SectionKey]: { content: SectionContentMap[K]; visible: boolean; order: number; hasDraft: boolean } };
  for (const key of SECTION_KEYS) {
    const row = page.sections.find((s) => s.key === key);
    const stored = ((preview && row?.draft ? row.draft : row?.content) ?? {}) as Values;
    (sections as Record<string, unknown>)[key] = {
      content: { ...SECTION_DEFAULTS[key], ...stored },
      visible: row?.visible ?? true,
      order: row?.order ?? SECTION_KEYS.indexOf(key),
      hasDraft: Boolean(row?.draft),
    };
  }

  const imageIds = [sections.hero.content.portraitId, sections.about.content.imageId].filter((v): v is string => !!v);
  const projectsCfg = sections.projects.content;
  const [sectionMedia, projects] = await Promise.all([
    imageIds.length ? db.media.findMany({ where: { id: { in: imageIds } }, select: mediaSelect }) : [],
    db.project.findMany({
      where: { ...(preview ? {} : livePublished()), ...(projectsCfg.featuredOnly ? { featured: true } : {}) },
      orderBy: [{ featured: "desc" }, { order: "asc" }, { createdAt: "desc" }],
      take: Math.min(Math.max(Number(projectsCfg.limit) || 4, 1), 24),
      select: projectCardSelect,
    }),
  ]);
  const findMedia = (id: string | null): MediaRef | null => sectionMedia.find((m) => m.id === id) ?? null;

  return {
    settings,
    seo: page.seo,
    nav,
    socials,
    skills,
    heroStats: stats.filter((s) => s.group === "HERO"),
    aboutStats: stats.filter((s) => s.group === "ABOUT"),
    clients,
    testimonials,
    projects,
    sections,
    heroPortrait: findMedia(sections.hero.content.portraitId) ?? settings.profileImage,
    aboutImage: findMedia(sections.about.content.imageId) ?? settings.profileImage,
    orderedSections: [...SECTION_KEYS].sort((a, b) => sections[a].order - sections[b].order),
  };
});

export type SiteData = Awaited<ReturnType<typeof getSiteData>>;
export type ProjectCardData = SiteData["projects"][number];

export const getAllProjects = cache(async (preview = false) =>
  db.project.findMany({
    where: preview ? {} : livePublished(),
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    select: projectCardSelect,
  }),
);

export const getProject = cache(async (slug: string, preview = false) =>
  db.project.findFirst({
    where: { slug, ...(preview ? {} : livePublished()) },
    include: {
      featuredImage: { select: mediaSelect },
      ogImage: { select: mediaSelect },
      images: { orderBy: { order: "asc" }, include: { media: { select: mediaSelect } } },
    },
  }),
);

export type ProjectDetail = NonNullable<Awaited<ReturnType<typeof getProject>>>;

/** Previous / next published projects for internal linking on detail pages. */
export async function getAdjacentProjects(id: string) {
  const all = await getAllProjects(false);
  const index = all.findIndex((p) => p.id === id);
  if (index === -1 || all.length < 2) return { prev: null, next: null };
  return { prev: all[(index - 1 + all.length) % all.length], next: all[(index + 1) % all.length] };
}

export async function findRedirect(pathname: string) {
  const source = pathname.replace(/\/+$/, "") || "/";
  return db.redirect.findFirst({ where: { source, enabled: true } });
}
