"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { imageSize } from "image-size";
import { db } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import type { Role } from "@/lib/generated/prisma/enums";
import { AuthError, assertUser, createSession, destroySession, type SessionUser } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  CLIENT_FIELDS, LIST_FIELDS, PROJECT_FIELDS, SECTION_DEFAULTS, SECTION_FIELDS, SECTION_KEYS, SEO_FIELDS,
  SETTINGS_FIELDS, TESTIMONIAL_FIELDS, type ListKind, type SectionKey,
} from "@/lib/fields";
import { schemaFromFields, zodFailure, type ActionResult } from "@/lib/validation/fields";
import { loginSchema, passwordSchema } from "@/lib/validation/schemas";
import { MAX_UPLOAD_BYTES, detectFileType, newStorageKey, storage } from "@/lib/storage";
import { mediaSelect } from "@/lib/services/content";
import { slugify } from "@/lib/utils";

// ── Helpers ─────────────────────────────────────────────────────────────────

const fail = (error: string): ActionResult => ({ ok: false, error });
const refresh = () => revalidatePath("/", "layout");

/** Authorises, runs, and converts unexpected failures into safe messages (details go to the server log only). */
async function run<T = unknown>(role: Role | undefined, fn: (user: SessionUser) => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    const user = await assertUser(role);
    return await fn(user);
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: error.message };
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") return { ok: false, error: "That value is already in use — it must be unique." };
      if (error.code === "P2025") return { ok: false, error: "That item no longer exists." };
    }
    console.error("[admin action]", error instanceof Error ? error.message : error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

const idSchema = z.string().min(1).max(40);

// ── Authentication ──────────────────────────────────────────────────────────

let dummyHash: Promise<string> | null = null;

export async function login(input: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return zodFailure(parsed.error);
  const ip = await clientIp();
  if (!rateLimit(`login:${ip}`, 8, 15 * 60_000).ok) {
    return fail("Too many sign-in attempts. Please wait a few minutes and try again.");
  }
  try {
    const user = await db.user.findUnique({ where: { email: parsed.data.email } });
    // Compare against a dummy hash when the user is unknown so timing does not reveal which emails exist.
    dummyHash ??= hashPassword("unused-placeholder-password");
    const valid = await verifyPassword(parsed.data.password, user?.passwordHash ?? (await dummyHash));
    if (!user || !valid) return fail("Incorrect email or password.");
    await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await createSession(user);
    return { ok: true };
  } catch (error) {
    console.error("[login]", error instanceof Error ? error.message : error);
    return fail("Sign-in is unavailable right now. Please try again.");
  }
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

export async function updateProfile(input: unknown) {
  return run(undefined, async (user) => {
    const parsed = z
      .object({ name: z.string().trim().min(1, "Enter your name").max(80), email: z.string().trim().toLowerCase().email("Enter a valid email") })
      .safeParse(input);
    if (!parsed.success) return zodFailure(parsed.error);
    await db.user.update({ where: { id: user.id }, data: parsed.data });
    revalidatePath("/admin", "layout");
    return { ok: true, message: "Profile updated." };
  });
}

export async function changePassword(input: unknown) {
  return run(undefined, async (user) => {
    const parsed = z.object({ current: z.string().min(1, "Enter your current password"), next: passwordSchema }).safeParse(input);
    if (!parsed.success) return zodFailure(parsed.error);
    const row = await db.user.findUniqueOrThrow({ where: { id: user.id } });
    if (!(await verifyPassword(parsed.data.current, row.passwordHash))) {
      return { ok: false, error: "Your current password is incorrect.", fieldErrors: { current: "Incorrect password" } };
    }
    // Bumping tokenVersion signs out every other session.
    const updated = await db.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(parsed.data.next), tokenVersion: { increment: 1 } },
    });
    await createSession(updated);
    return { ok: true, message: "Password changed. Other sessions have been signed out." };
  });
}

export async function saveUser(id: string | null, input: unknown) {
  return run("ADMIN", async (current) => {
    const parsed = z
      .object({
        name: z.string().trim().min(1, "Enter a name").max(80),
        email: z.string().trim().toLowerCase().email("Enter a valid email"),
        role: z.enum(["ADMIN", "EDITOR"]),
        password: z.union([z.literal(""), passwordSchema]),
      })
      .safeParse(input);
    if (!parsed.success) return zodFailure(parsed.error);
    const { password, ...data } = parsed.data;
    if (!id) {
      if (!password) return { ok: false, error: "Set a password for the new user.", fieldErrors: { password: "Required" } };
      await db.user.create({ data: { ...data, passwordHash: await hashPassword(password) } });
      return { ok: true, message: "User created." };
    }
    if (id === current.id && data.role !== "ADMIN") return fail("You cannot remove your own administrator role.");
    await db.user.update({
      where: { id },
      data: { ...data, ...(password ? { passwordHash: await hashPassword(password), tokenVersion: { increment: 1 } } : {}) },
    });
    return { ok: true, message: "User updated." };
  });
}

export async function deleteUser(id: string) {
  return run("ADMIN", async (current) => {
    if (id === current.id) return fail("You cannot delete your own account.");
    await db.user.delete({ where: { id: idSchema.parse(id) } });
    return { ok: true, message: "User deleted." };
  });
}

// ── Page sections ───────────────────────────────────────────────────────────

const isSectionKey = (key: string): key is SectionKey => (SECTION_KEYS as readonly string[]).includes(key);

async function homePageId() {
  const page = await db.page.findUniqueOrThrow({ where: { slug: "home" }, select: { id: true } });
  return page.id;
}

export async function saveSection(key: string, values: unknown, mode: "draft" | "publish") {
  return run(undefined, async () => {
    if (!isSectionKey(key)) return fail("Unknown section.");
    const parsed = schemaFromFields(SECTION_FIELDS[key]).safeParse(values);
    if (!parsed.success) return zodFailure(parsed.error);
    const data = parsed.data as Prisma.InputJsonObject;
    const pageId = await homePageId();
    await db.pageSection.upsert({
      where: { pageId_key: { pageId, key } },
      create: {
        pageId, key, order: SECTION_KEYS.indexOf(key),
        content: mode === "publish" ? data : (SECTION_DEFAULTS[key] as Prisma.InputJsonObject),
        draft: mode === "draft" ? data : Prisma.DbNull,
      },
      update: mode === "publish" ? { content: data, draft: Prisma.DbNull } : { draft: data },
    });
    if (mode === "publish") refresh();
    return { ok: true, message: mode === "publish" ? "Published." : "Draft saved — not public yet." };
  });
}

export async function discardSectionDraft(key: string) {
  return run(undefined, async () => {
    if (!isSectionKey(key)) return fail("Unknown section.");
    await db.pageSection.updateMany({ where: { pageId: await homePageId(), key }, data: { draft: Prisma.DbNull } });
    return { ok: true, message: "Draft discarded." };
  });
}

export async function setSectionVisible(key: string, visible: boolean) {
  return run(undefined, async () => {
    if (!isSectionKey(key)) return fail("Unknown section.");
    await db.pageSection.updateMany({ where: { pageId: await homePageId(), key }, data: { visible: Boolean(visible) } });
    refresh();
    return { ok: true, message: visible ? "Section is now visible." : "Section hidden from the site." };
  });
}

export async function moveSection(key: string, direction: "up" | "down") {
  return run(undefined, async () => {
    const pageId = await homePageId();
    const rows = await db.pageSection.findMany({ where: { pageId }, orderBy: { order: "asc" }, select: { id: true, key: true } });
    const index = rows.findIndex((r) => r.key === key);
    const target = direction === "up" ? index - 1 : index + 1;
    if (index === -1 || target < 0 || target >= rows.length) return { ok: true };
    [rows[index], rows[target]] = [rows[target], rows[index]];
    await db.$transaction(rows.map((r, order) => db.pageSection.update({ where: { id: r.id }, data: { order } })));
    refresh();
    return { ok: true, message: "Section order updated." };
  });
}

// ── Simple ordered lists (skills, statistics, navigation, social links, redirects) ──

type LooseDelegate = {
  findMany(args?: unknown): Promise<{ id: string }[]>;
  deleteMany(args: unknown): Promise<unknown>;
  update(args: unknown): Promise<unknown>;
  create(args: unknown): Promise<unknown>;
};

function listTarget(tx: Prisma.TransactionClient, kind: ListKind): { model: LooseDelegate; scope: Record<string, unknown> } {
  switch (kind) {
    case "skill": return { model: tx.skill as unknown as LooseDelegate, scope: {} };
    case "heroStat": return { model: tx.statistic as unknown as LooseDelegate, scope: { group: "HERO" } };
    case "aboutStat": return { model: tx.statistic as unknown as LooseDelegate, scope: { group: "ABOUT" } };
    case "nav": return { model: tx.navItem as unknown as LooseDelegate, scope: {} };
    case "social": return { model: tx.socialLink as unknown as LooseDelegate, scope: {} };
    case "redirect": return { model: tx.redirect as unknown as LooseDelegate, scope: {} };
  }
}

export async function saveList(kind: ListKind, rows: unknown) {
  return run(kind === "redirect" ? "ADMIN" : undefined, async () => {
    if (!(kind in LIST_FIELDS)) return fail("Unknown list.");
    const rowSchema = schemaFromFields(LIST_FIELDS[kind]).extend({
      id: z.string().max(40).optional(),
      visible: z.coerce.boolean().default(true),
    });
    const parsed = z.array(rowSchema).max(100).safeParse(rows);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return fail(`Row ${Number(issue.path[0]) + 1}: ${issue.message}`);
    }
    const items = parsed.data as Array<Record<string, unknown> & { id?: string; visible: boolean }>;
    if (kind === "redirect") {
      for (const item of items) {
        const source = `/${String(item.source).replace(/^\/+|\/+$/g, "")}`;
        if (source.startsWith("/admin") || source === "/") return fail("Redirects cannot start from / or /admin.");
        item.source = source;
      }
      if (new Set(items.map((i) => i.source)).size !== items.length) return fail("Each “from” path can only be used once.");
    }
    await db.$transaction(async (tx) => {
      const { model, scope } = listTarget(tx, kind);
      const existing = new Set((await model.findMany({ where: scope, select: { id: true } })).map((r) => r.id));
      const keep = items.map((i) => i.id).filter((id): id is string => !!id && existing.has(id));
      await model.deleteMany({ where: { ...scope, id: { notIn: keep } } });
      for (const [order, { id, visible, ...fields }] of items.entries()) {
        const data = kind === "redirect" ? { ...fields, enabled: visible } : { ...fields, visible, order };
        if (id && existing.has(id)) await model.update({ where: { id }, data });
        else await model.create({ data: { ...data, ...scope } });
      }
    });
    refresh();
    return { ok: true, message: "Saved." };
  });
}

// ── Projects, testimonials, clients ─────────────────────────────────────────

type EntityKind = "project" | "testimonial" | "client";
type LooseEntity = {
  findMany(args?: unknown): Promise<Array<{ id: string; order: number } & Record<string, unknown>>>;
  findUniqueOrThrow(args: unknown): Promise<Record<string, unknown>>;
  update(args: unknown): Promise<unknown>;
  delete(args: unknown): Promise<unknown>;
};
const ENTITY_TOGGLES: Record<EntityKind, string[]> = {
  project: ["featured", "status"],
  testimonial: ["featured", "status"],
  client: ["visible"],
};
function entityModel(kind: EntityKind): LooseEntity {
  const models = { project: db.project, testimonial: db.testimonial, client: db.client };
  if (!(kind in models)) throw new Error("Unknown entity");
  return models[kind] as unknown as LooseEntity;
}

async function uniqueSlug(base: string, excludeId?: string) {
  const root = base || "project";
  for (let n = 1; n < 200; n++) {
    const slug = n === 1 ? root : `${root}-${n}`;
    const clash = await db.project.findUnique({ where: { slug }, select: { id: true } });
    if (!clash || clash.id === excludeId) return slug;
  }
  return `${root}-${Date.now()}`;
}

export async function saveProject(id: string | null, values: unknown): Promise<ActionResult<{ id: string }>> {
  return run(undefined, async () => {
    const parsed = schemaFromFields(PROJECT_FIELDS).safeParse(values);
    if (!parsed.success) return zodFailure(parsed.error) as ActionResult<{ id: string }>;
    const { gallery, slug: rawSlug, ...rest } = parsed.data as Record<string, unknown> & { gallery: string[]; slug: string; title: string };
    const slug = await uniqueSlug(slugify(rawSlug || rest.title), id ?? undefined);
    const data = { ...rest, slug } as Prisma.ProjectUncheckedCreateInput;
    const galleryIds = [...new Set(gallery)];
    const validMedia = new Set(
      (await db.media.findMany({ where: { id: { in: galleryIds } }, select: { id: true } })).map((m) => m.id),
    );
    const images = galleryIds.filter((m) => validMedia.has(m)).map((mediaId, order) => ({ mediaId, order }));

    const saved = await db.$transaction(async (tx) => {
      if (!id) return tx.project.create({ data: { ...data, images: { create: images } }, select: { id: true } });
      const before = await tx.project.findUniqueOrThrow({ where: { id }, select: { slug: true, status: true } });
      if (before.slug !== slug && before.status === "PUBLISHED") {
        // Keep old links working when a live project's URL changes.
        await tx.redirect.deleteMany({ where: { source: `/projects/${slug}` } });
        await tx.redirect.upsert({
          where: { source: `/projects/${before.slug}` },
          create: { source: `/projects/${before.slug}`, destination: `/projects/${slug}`, permanent: true },
          update: { destination: `/projects/${slug}`, enabled: true },
        });
      }
      await tx.projectImage.deleteMany({ where: { projectId: id } });
      return tx.project.update({ where: { id }, data: { ...data, images: { create: images } }, select: { id: true } });
    });
    refresh();
    return { ok: true, message: id ? "Project saved." : "Project created.", data: { id: saved.id } };
  });
}

export async function duplicateProject(id: string) {
  return run(undefined, async () => {
    const source = await db.project.findUniqueOrThrow({ where: { id: idSchema.parse(id) }, include: { images: true } });
    const { id: _id, createdAt: _c, updatedAt: _u, images, ...copy } = source;
    void _id; void _c; void _u;
    await db.project.create({
      data: {
        ...copy,
        title: `${source.title} (Copy)`,
        slug: await uniqueSlug(`${source.slug}-copy`),
        status: "DRAFT",
        featured: false,
        publishAt: null,
        order: source.order + 1,
        images: { create: images.map(({ mediaId, order }) => ({ mediaId, order })) },
      },
    });
    return { ok: true, message: "Project duplicated as a draft." };
  });
}

export async function saveTestimonial(id: string | null, values: unknown) {
  return run(undefined, async () => {
    const parsed = schemaFromFields(TESTIMONIAL_FIELDS).safeParse(values);
    if (!parsed.success) return zodFailure(parsed.error);
    const data = { ...parsed.data, rating: Number(parsed.data.rating) } as Prisma.TestimonialUncheckedCreateInput;
    if (id) await db.testimonial.update({ where: { id }, data });
    else await db.testimonial.create({ data });
    refresh();
    return { ok: true, message: "Testimonial saved." };
  });
}

export async function saveClient(id: string | null, values: unknown) {
  return run(undefined, async () => {
    const parsed = schemaFromFields(CLIENT_FIELDS).safeParse(values);
    if (!parsed.success) return zodFailure(parsed.error);
    const data = parsed.data as Prisma.ClientUncheckedCreateInput;
    if (id) await db.client.update({ where: { id }, data });
    else await db.client.create({ data });
    refresh();
    return { ok: true, message: "Client saved." };
  });
}

export async function deleteEntity(kind: EntityKind, id: string) {
  return run(undefined, async () => {
    await entityModel(kind).delete({ where: { id: idSchema.parse(id) } });
    refresh();
    return { ok: true, message: "Deleted." };
  });
}

export async function toggleEntity(kind: EntityKind, id: string, field: string) {
  return run(undefined, async () => {
    if (!ENTITY_TOGGLES[kind]?.includes(field)) return fail("That field cannot be toggled.");
    const model = entityModel(kind);
    const row = await model.findUniqueOrThrow({ where: { id: idSchema.parse(id) } });
    const next = field === "status" ? (row.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED") : !row[field];
    await model.update({ where: { id }, data: { [field]: next } });
    refresh();
    const message =
      field === "status" ? (next === "PUBLISHED" ? "Published." : "Unpublished — now a draft.")
      : field === "featured" ? (next ? "Marked as featured." : "Removed from featured.")
      : next ? "Now visible." : "Hidden from the site.";
    return { ok: true, message };
  });
}

export async function moveEntity(kind: EntityKind, id: string, direction: "up" | "down") {
  return run(undefined, async () => {
    const model = entityModel(kind);
    const rows = await model.findMany({ orderBy: [{ order: "asc" }, { id: "asc" }], select: { id: true, order: true } });
    const index = rows.findIndex((r) => r.id === id);
    const target = direction === "up" ? index - 1 : index + 1;
    if (index === -1 || target < 0 || target >= rows.length) return { ok: true };
    [rows[index], rows[target]] = [rows[target], rows[index]];
    await Promise.all(rows.map((r, order) => (r.order === order ? null : model.update({ where: { id: r.id }, data: { order } }))));
    refresh();
    return { ok: true, message: "Order updated." };
  });
}

// ── Leads ───────────────────────────────────────────────────────────────────

export async function setLeadStatus(id: string, status: string) {
  return run(undefined, async () => {
    const parsed = z.enum(["NEW", "CONTACTED", "QUALIFIED", "CLOSED"]).safeParse(status);
    if (!parsed.success) return fail("Unknown status.");
    await db.contactLead.update({ where: { id: idSchema.parse(id) }, data: { status: parsed.data } });
    return { ok: true, message: `Marked as ${parsed.data.toLowerCase()}.` };
  });
}

export async function addLeadNote(id: string, body: string) {
  return run(undefined, async (user) => {
    const parsed = z.string().trim().min(1, "Write a note first.").max(2000).safeParse(body);
    if (!parsed.success) return fail(parsed.error.issues[0].message);
    await db.leadNote.create({ data: { leadId: idSchema.parse(id), authorId: user.id, body: parsed.data } });
    return { ok: true, message: "Note added." };
  });
}

export async function deleteLeadNote(noteId: string) {
  return run(undefined, async () => {
    await db.leadNote.delete({ where: { id: idSchema.parse(noteId) } });
    return { ok: true, message: "Note deleted." };
  });
}

export async function deleteLead(id: string) {
  return run("ADMIN", async () => {
    await db.contactLead.delete({ where: { id: idSchema.parse(id) } });
    return { ok: true, message: "Lead deleted." };
  });
}

// ── Media ───────────────────────────────────────────────────────────────────

export type MediaItem = {
  id: string; url: string; alt: string; width: number | null; height: number | null; mime: string;
  filename: string; size?: number; createdAt?: Date;
};

export async function uploadMedia(formData: FormData): Promise<ActionResult<MediaItem[]>> {
  return run(undefined, async () => {
    const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    if (!files.length) return fail("Choose at least one file.") as ActionResult<MediaItem[]>;
    if (files.length > 12) return fail("Upload up to 12 files at a time.") as ActionResult<MediaItem[]>;
    const created: MediaItem[] = [];
    for (const file of files) {
      if (file.size > MAX_UPLOAD_BYTES) return fail(`“${file.name}” is larger than 10 MB.`) as ActionResult<MediaItem[]>;
      const buffer = Buffer.from(await file.arrayBuffer());
      const kind = detectFileType(buffer);
      if (!kind) {
        return fail(`“${file.name}” is not a supported type. Use JPG, PNG, WebP, AVIF, GIF, ICO or PDF.`) as ActionResult<MediaItem[]>;
      }
      let width: number | null = null;
      let height: number | null = null;
      if (kind.mime.startsWith("image/")) {
        try {
          const size = imageSize(buffer);
          width = size.width ?? null;
          height = size.height ?? null;
        } catch {
          /* dimensions are optional */
        }
      }
      const stored = await storage().put(newStorageKey(file.name, kind.ext), buffer, kind.mime);
      const media = await db.media.create({
        data: { ...stored, filename: file.name.slice(0, 200), mime: kind.mime, size: file.size, width, height },
        select: { ...mediaSelect, size: true, createdAt: true },
      });
      created.push(media);
    }
    return { ok: true, message: `${created.length} file${created.length === 1 ? "" : "s"} uploaded.`, data: created };
  });
}

export async function fetchMedia(query: { q?: string; kind?: "image" | "file"; page?: number }): Promise<ActionResult<{ items: MediaItem[]; total: number }>> {
  return run(undefined, async () => {
    const page = Math.max(1, Number(query.page) || 1);
    const where: Prisma.MediaWhereInput = {
      ...(query.q ? { OR: [{ filename: { contains: query.q, mode: "insensitive" } }, { alt: { contains: query.q, mode: "insensitive" } }] } : {}),
      ...(query.kind === "image" ? { mime: { startsWith: "image/" } } : query.kind === "file" ? { mime: "application/pdf" } : {}),
    };
    const [items, total] = await Promise.all([
      db.media.findMany({ where, orderBy: { createdAt: "desc" }, take: 24, skip: (page - 1) * 24, select: { ...mediaSelect, size: true, createdAt: true } }),
      db.media.count({ where }),
    ]);
    return { ok: true, data: { items, total } };
  });
}

export async function updateMediaAlt(id: string, alt: string) {
  return run(undefined, async () => {
    await db.media.update({ where: { id: idSchema.parse(id) }, data: { alt: z.string().trim().max(300).parse(alt) } });
    refresh();
    return { ok: true, message: "Alt text saved." };
  });
}

export async function deleteMedia(id: string) {
  return run(undefined, async () => {
    const media = await db.media.findUniqueOrThrow({ where: { id: idSchema.parse(id) } });
    await db.media.delete({ where: { id } });
    if (media.provider !== "seed") await storage(media.provider).remove(media.key);
    refresh();
    return { ok: true, message: "File deleted." };
  });
}

// ── Settings & SEO ──────────────────────────────────────────────────────────

export async function saveSettings(values: unknown) {
  return run("ADMIN", async () => {
    const parsed = schemaFromFields(SETTINGS_FIELDS).safeParse(values);
    if (!parsed.success) return zodFailure(parsed.error);
    await db.siteSettings.update({ where: { id: 1 }, data: parsed.data as Prisma.SiteSettingsUncheckedUpdateInput });
    refresh();
    return { ok: true, message: "Settings saved." };
  });
}

export async function saveSeo(values: unknown) {
  return run(undefined, async () => {
    const parsed = schemaFromFields(SEO_FIELDS).safeParse(values);
    if (!parsed.success) return zodFailure(parsed.error);
    await db.sEOSettings.update({ where: { pageId: await homePageId() }, data: parsed.data as Prisma.SEOSettingsUncheckedUpdateInput });
    refresh();
    return { ok: true, message: "SEO settings saved." };
  });
}
