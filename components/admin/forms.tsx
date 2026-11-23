"use client";

import { useRouter } from "next/navigation";
import {
  discardSectionDraft, saveClient, saveProject, saveSection, saveSeo, saveSettings, saveTestimonial, type MediaItem,
} from "@/lib/actions/admin";
import {
  CLIENT_FIELDS, PROJECT_FIELDS, SECTION_FIELDS, SEO_FIELDS, SETTINGS_FIELDS, TESTIMONIAL_FIELDS, type SectionKey, type Values,
} from "@/lib/fields";
import { SchemaForm } from "@/components/admin/SchemaForm";
import { ActionButton } from "@/components/admin/ui";

type Common = { initial: Values; media?: Record<string, MediaItem> };

export function SectionForm({ sectionKey, hasDraft, ...rest }: Common & { sectionKey: SectionKey; hasDraft: boolean }) {
  return (
    <SchemaForm
      {...rest}
      fields={SECTION_FIELDS[sectionKey]}
      buttons={[{ intent: "publish", label: "Publish", primary: true }, { intent: "draft", label: "Save draft" }]}
      onSubmit={(values, intent) => saveSection(sectionKey, values, intent === "publish" ? "publish" : "draft")}
      extraActions={
        <>
          <a href="/preview" target="_blank" className="a-btn">Preview</a>
          {hasDraft && <ActionButton action={discardSectionDraft.bind(null, sectionKey)} className="a-btn a-btn-danger">Discard draft</ActionButton>}
        </>
      }
    />
  );
}

export function ProjectForm({ id, slug, siteUrl, ...rest }: Common & { id: string | null; slug?: string; siteUrl: string }) {
  const router = useRouter();
  return (
    <SchemaForm
      {...rest}
      fields={PROJECT_FIELDS}
      buttons={[{ intent: "save", label: id ? "Save project" : "Create project", primary: true }]}
      onSubmit={(values) => saveProject(id, values)}
      onDone={(result) => {
        const data = result.ok ? (result.data as { id: string } | undefined) : undefined;
        if (!id && data?.id) router.replace(`/admin/projects/${data.id}`);
      }}
      extraActions={slug ? <a href={`/preview/projects/${slug}`} target="_blank" className="a-btn">Preview</a> : null}
      aside={(v) => (
        <SeoPreview
          title={String(v.seoTitle || v.title || "Project title")}
          description={String(v.seoDescription || v.shortDescription || "")}
          url={`${siteUrl}/projects/${String(v.slug || slug || "your-slug")}`}
          image={rest.media?.[String(v.ogImageId ?? v.featuredImageId ?? "")]?.url}
        />
      )}
    />
  );
}

export function TestimonialForm({ id, ...rest }: Common & { id: string | null }) {
  const router = useRouter();
  return (
    <SchemaForm {...rest} fields={TESTIMONIAL_FIELDS} buttons={[{ intent: "save", label: "Save testimonial", primary: true }]}
      onSubmit={(values) => saveTestimonial(id, values)} onDone={(r) => r.ok && router.push("/admin/testimonials")} />
  );
}

export function ClientForm({ id, ...rest }: Common & { id: string | null }) {
  const router = useRouter();
  return (
    <SchemaForm {...rest} fields={CLIENT_FIELDS} buttons={[{ intent: "save", label: "Save client", primary: true }]}
      onSubmit={(values) => saveClient(id, values)} onDone={(r) => r.ok && router.push("/admin/clients")} />
  );
}

export function SettingsForm(props: Common) {
  return <SchemaForm {...props} fields={SETTINGS_FIELDS} buttons={[{ intent: "save", label: "Save settings", primary: true }]} onSubmit={(values) => saveSettings(values)} />;
}

export function SeoForm({ siteUrl, fallbackImage, ...rest }: Common & { siteUrl: string; fallbackImage?: string }) {
  return (
    <SchemaForm
      {...rest}
      fields={SEO_FIELDS}
      buttons={[{ intent: "save", label: "Save SEO settings", primary: true }]}
      onSubmit={(values) => saveSeo(values)}
      aside={(v) => (
        <SeoPreview
          title={String(v.title || "")}
          description={String(v.description || "")}
          url={String(v.canonicalUrl || siteUrl)}
          socialTitle={String(v.ogTitle || v.title || "")}
          socialDescription={String(v.ogDescription || v.description || "")}
          image={rest.media?.[String(v.ogImageId ?? "")]?.url ?? fallbackImage}
          large={v.twitterCard !== "summary"}
          noindex={!v.robotsIndex}
        />
      )}
    />
  );
}

/** Approximate previews of a Google result and a social share card. */
export function SeoPreview({
  title, description, url, socialTitle, socialDescription, image, large = true, noindex,
}: { title: string; description: string; url: string; socialTitle?: string; socialDescription?: string; image?: string; large?: boolean; noindex?: boolean }) {
  let host = url;
  let path = "";
  try {
    const u = new URL(url);
    host = u.host;
    path = u.pathname.split("/").filter(Boolean).join(" › ");
  } catch {
    /* show the raw value */
  }
  const clip = (text: string, n: number) => (text.length > n ? `${text.slice(0, n - 1)}…` : text);
  return (
    <>
      <div className="a-card p-5">
        <h2 className="text-sm font-semibold">Search result preview</h2>
        <div className="mt-4 rounded-xl border border-[#e6e8ef] p-4">
          <p className="truncate text-xs text-gray-600">{host}{path && ` › ${path}`}</p>
          <p className="mt-1 text-[18px] leading-snug text-[#1a0dab]">{clip(title, 60) || "Page title"}</p>
          <p className="mt-1 text-[13px] leading-snug text-gray-600">{clip(description, 158) || "Add a meta description to control this text."}</p>
        </div>
        <ul className="mt-3 space-y-1 text-xs text-gray-500">
          <li className={title.length > 60 ? "text-amber-700" : ""}>Title: {title.length}/60 characters</li>
          <li className={description.length > 160 || description.length < 50 ? "text-amber-700" : ""}>Description: {description.length}/160 characters</li>
          {noindex && <li className="text-red-600">Indexing is off — search engines are asked not to list the site.</li>}
        </ul>
      </div>
      <div className="a-card p-5">
        <h2 className="text-sm font-semibold">Social share preview</h2>
        <div className={`mt-4 overflow-hidden rounded-xl border border-[#e6e8ef] ${large ? "" : "flex"}`}>
          <div className={`bg-[#f3f4f8] ${large ? "aspect-[1200/630] w-full" : "size-24 shrink-0"}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {image ? <img src={image} alt="" className="size-full object-cover" /> : <span className="flex size-full items-center justify-center text-xs text-gray-400">No image</span>}
          </div>
          <div className="min-w-0 p-3">
            <p className="truncate text-[11px] uppercase text-gray-500">{host}</p>
            <p className="truncate text-sm font-semibold">{socialTitle ?? title}</p>
            <p className="line-clamp-2 text-xs text-gray-600">{socialDescription ?? description}</p>
          </div>
        </div>
      </div>
    </>
  );
}
