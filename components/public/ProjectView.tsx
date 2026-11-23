import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { SmartImage } from "@/components/shared/SmartImage";
import { Magnetic, Reveal } from "@/components/public/motion";
import type { ProjectCardData, ProjectDetail } from "@/lib/services/content";
import { formatDate, isExternal } from "@/lib/utils";

export function ProjectView({
  project, prev, next,
}: { project: ProjectDetail; prev?: ProjectCardData | null; next?: ProjectCardData | null }) {
  const gallery = project.images.map((i) => i.media).filter((m) => m.id !== project.featuredImageId);
  const facts = [
    ["Client", project.clientName],
    ["Category", project.category],
    ["Completed", project.completedAt ? formatDate(project.completedAt, { year: "numeric", month: "long" }) : ""],
    ["Status", project.projectStatus],
  ].filter(([, v]) => v);

  return (
    <article className="px-5 pb-20 pt-8 sm:px-10 lg:px-20 lg:pb-24 lg:pt-12">
      <nav aria-label="Breadcrumb" className="enter text-[13px] text-muted">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/" className="hover:text-ink">Home</Link></li>
          <li aria-hidden>/</li>
          <li><Link href="/projects" className="hover:text-ink">Projects</Link></li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-ink">{project.title}</li>
        </ol>
      </nav>

      <header className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:items-end">
        <div>
          {project.category && <p className="enter text-sm text-muted" style={{ "--i": 1 } as React.CSSProperties}>{project.category}</p>}
          <h1 className="display mt-3 text-[clamp(2.5rem,6vw,4.75rem)]">
            <span className="line-mask"><span>{project.title}</span></span>
          </h1>
          {project.shortDescription && (
            <p className="enter mt-6 max-w-2xl text-lg leading-relaxed text-ink/80" style={{ "--i": 3 } as React.CSSProperties}>{project.shortDescription}</p>
          )}
        </div>
        <div className="enter flex flex-wrap gap-3 lg:justify-end" style={{ "--i": 4 } as React.CSSProperties}>
          {isExternal(project.projectUrl) && (
            <Magnetic>
              <a href={project.projectUrl} target="_blank" rel="noopener noreferrer" data-cursor className="group inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-3 text-[13px] font-semibold text-panel">
                Visit project
                <ArrowUpRight className="size-4 transition-transform duration-500 ease-premium group-hover:rotate-45" aria-hidden />
              </a>
            </Magnetic>
          )}
          {isExternal(project.githubUrl) && (
            <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-ink/60 px-5 py-3 text-[13px] font-semibold transition-colors hover:bg-ink hover:text-panel">
              View source
              <ArrowUpRight className="size-4" aria-hidden />
            </a>
          )}
        </div>
      </header>

      {project.featuredImage && (
        <Reveal className="relative mt-12 aspect-[16/10] overflow-hidden rounded-[22px] bg-soft">
          <SmartImage
            src={project.featuredImage.url}
            alt={project.featuredImage.alt || `${project.title} — main preview`}
            fill
            priority
            sizes="(min-width: 1280px) 1080px, 94vw"
            className="object-cover"
          />
        </Reveal>
      )}

      <div className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)]">
        <Reveal>
          <aside aria-label="Project details" className="rounded-[22px] bg-soft p-7">
            <dl className="space-y-5 text-sm">
              {facts.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-6 border-b border-line pb-4">
                  <dt className="text-muted">{label}</dt>
                  <dd className="text-right font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            {project.technologies.length > 0 && (
              <>
                <h2 className="mt-6 text-sm text-muted">Technology stack</h2>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {project.technologies.map((tech) => (
                    <li key={tech} className="rounded-full bg-panel px-3 py-1.5 text-[13px]">{tech}</li>
                  ))}
                </ul>
              </>
            )}
          </aside>
        </Reveal>
        <Reveal delay={0.1}>
          {project.description ? (
            <div className="prose-site [&>*:first-child]:mt-0" dangerouslySetInnerHTML={{ __html: project.description }} />
          ) : (
            <p className="text-muted">{project.shortDescription}</p>
          )}
        </Reveal>
      </div>

      {gallery.length > 0 && (
        <section aria-label="Project gallery" className="mt-16 grid gap-4 sm:grid-cols-2">
          {gallery.map((image, n) => (
            <Reveal key={image.id} delay={(n % 2) * 0.08} className={`group relative aspect-[4/3] overflow-hidden rounded-[18px] bg-soft ${gallery.length % 2 === 1 && n === 0 ? "sm:col-span-2 sm:aspect-[16/9]" : ""}`}>
              <SmartImage
                src={image.url}
                alt={image.alt || `${project.title} — screenshot ${n + 1}`}
                fill
                sizes="(min-width: 640px) 50vw, 94vw"
                className="object-cover transition-transform duration-[1100ms] ease-premium group-hover:scale-[1.04]"
              />
            </Reveal>
          ))}
        </section>
      )}

      <nav aria-label="More projects" className="mt-16 grid gap-4 border-t border-line pt-10 sm:grid-cols-2">
        {prev ? (
          <Link href={`/projects/${prev.slug}`} className="group">
            <span className="flex items-center gap-2 text-[13px] text-muted"><ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" aria-hidden />Previous project</span>
            <span className="display mt-2 block text-3xl">{prev.title}</span>
          </Link>
        ) : <span />}
        {next && (
          <Link href={`/projects/${next.slug}`} className="group sm:text-right">
            <span className="flex items-center gap-2 text-[13px] text-muted sm:justify-end">Next project<ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden /></span>
            <span className="display mt-2 block text-3xl">{next.title}</span>
          </Link>
        )}
      </nav>

      <div className="mt-16 flex flex-col items-center rounded-[28px] bg-soft px-6 py-14 text-center">
        <p className="display text-[clamp(2rem,4.5vw,3.25rem)]">Have a similar project in mind?</p>
        <Magnetic className="mt-7">
          <Link href="/#contact" data-cursor className="group inline-flex items-center gap-1.5 rounded-full bg-ink px-6 py-3.5 text-[13px] font-semibold text-panel">
            Start a conversation
            <ArrowUpRight className="size-4 transition-transform duration-500 ease-premium group-hover:rotate-45" aria-hidden />
          </Link>
        </Magnetic>
      </div>
    </article>
  );
}
