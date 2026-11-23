import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SmartImage } from "@/components/shared/SmartImage";
import { Magnetic, Reveal } from "@/components/public/motion";
import type { ProjectCardData, SiteData } from "@/lib/services/content";

export function ProjectCard({
  project, filled, label, priority, hrefBase = "/projects",
}: { project: ProjectCardData; filled?: boolean; label: string; priority?: boolean; hrefBase?: string }) {
  const href = `${hrefBase}/${project.slug}`;
  return (
    <article className="group">
      <Link href={href} data-cursor="View" aria-label={`${project.title} — view project`} className="relative block aspect-square overflow-hidden rounded-xl bg-soft">
        {project.featuredImage && (
          <SmartImage
            src={project.featuredImage.url}
            alt={project.featuredImage.alt || `${project.title} preview`}
            fill
            priority={priority}
            sizes="(min-width: 768px) 420px, 92vw"
            className="object-cover transition-transform duration-[1100ms] ease-premium group-hover:scale-[1.06]"
          />
        )}
        <span aria-hidden className="absolute inset-0 bg-ink/0 transition-colors duration-700 group-hover:bg-ink/[0.06]" />
      </Link>
      <h3 className="mt-5 text-[22px] font-semibold leading-tight tracking-tight lg:text-[25px]">
        <Link href={href} className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-[position:0_100%] bg-no-repeat transition-[background-size] duration-500 ease-premium hover:bg-[length:100%_1px]">
          {project.title}
        </Link>
        {project.status === "DRAFT" && <span className="ml-2 align-middle text-[11px] font-medium uppercase tracking-wide text-muted">Draft</span>}
      </h3>
      {project.category && <p className="mt-2.5 text-[13px] text-muted">{project.category}</p>}
      <Link
        href={href}
        className={`mt-5 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors duration-300 ${
          filled ? "border-ink bg-ink text-panel hover:bg-transparent hover:text-ink" : "border-ink/60 text-ink hover:bg-ink hover:text-panel"
        }`}
      >
        {label}
        <ArrowUpRight className="size-3.5" strokeWidth={2} aria-hidden />
        <span className="sr-only">: {project.title}</span>
      </Link>
    </article>
  );
}

export function SelectedProjects({ data, hrefBase }: { data: SiteData; hrefBase?: string }) {
  const cfg = data.sections.projects.content;
  const projects = data.projects;
  const evenCount = projects.length % 2 === 0;
  return (
    <section id="projects" aria-labelledby="projects-heading" className="px-5 py-20 sm:px-10 lg:px-20 lg:py-28">
      <Reveal>
        <h2 id="projects-heading" className="display text-center text-[clamp(2.6rem,7.2vw,5.6rem)]">{cfg.heading}</h2>
      </Reveal>

      {projects.length === 0 ? (
        <p className="mt-12 text-center text-muted">Projects will appear here soon.</p>
      ) : (
        <div className={`relative mx-auto mt-12 max-w-[1100px] md:mt-20 md:px-[5%] ${cfg.viewAllLabel ? (evenCount ? "md:pb-[260px]" : "md:pb-10") : "md:pb-28"}`}>
          {/* Staggered two-column layout: the right column sits lower than the left. */}
          <div className="grid gap-y-14 md:grid-cols-[37.6%_37.6%] md:justify-between md:gap-y-12">
            {projects.map((project, n) => (
              <Reveal key={project.id} delay={(n % 2) * 0.12} className={n % 2 === 1 ? "md:translate-y-28" : ""}>
                <ProjectCard project={project} filled={n === 0} label={cfg.previewLabel || "Preview Project"} priority={n < 2} hrefBase={hrefBase} />
              </Reveal>
            ))}
          </div>

          {cfg.viewAllLabel && (
            <Reveal className={`mt-14 flex justify-center md:absolute md:bottom-0 md:mt-0 md:block md:-translate-x-1/2 ${evenCount ? "md:left-[23.8%]" : "md:left-[76.2%]"}`}>
              <Magnetic strength={0.35}>
                <Link
                  href={hrefBase === "/preview/projects" ? "/projects" : "/projects"}
                  data-cursor
                  className="display flex size-[150px] items-center justify-center rounded-full border border-ink/70 text-center text-[28px] leading-[1.1] transition-colors duration-500 hover:bg-ink hover:text-panel"
                >
                  <span className="max-w-[90px]">{cfg.viewAllLabel}</span>
                </Link>
              </Magnetic>
            </Reveal>
          )}
        </div>
      )}
    </section>
  );
}
