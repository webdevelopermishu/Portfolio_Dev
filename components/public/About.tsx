import Link from "next/link";
import { ArrowUpRight, Check, CodeXml } from "lucide-react";
import { SmartImage } from "@/components/shared/SmartImage";
import { CircularBadge } from "@/components/public/CircularBadge";
import { Counter, Reveal } from "@/components/public/motion";
import type { SiteData } from "@/lib/services/content";
import { safeHref } from "@/lib/utils";

export function About({ data }: { data: SiteData }) {
  const about = data.sections.about.content;
  const image = data.aboutImage;
  return (
    <section id="about" aria-labelledby="about-heading" className="px-3 sm:px-4">
      <div className="rounded-[28px] bg-soft px-5 py-12 sm:px-10 lg:px-16 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,350fr)_minmax(0,330fr)_minmax(0,345fr)] lg:gap-9">
          <div className="flex flex-col">
            <Reveal>
              <h2 id="about-heading" className="display text-[44px] lg:text-[52px]">{about.heading}</h2>
              {about.biography && <p className="mt-6 whitespace-pre-line text-[15px] leading-[1.5] text-ink/80">{about.biography}</p>}
            </Reveal>
            {about.showStats && data.aboutStats.length > 0 && (
              <dl className="mt-10 grid grid-cols-2 gap-2.5 lg:mt-auto lg:pt-12">
                {data.aboutStats.map((stat, n) => (
                  <Reveal key={stat.id} delay={n * 0.07} className="flex flex-col-reverse justify-end rounded-2xl bg-panel px-3.5 pb-3.5 pt-3">
                    <dt className="mt-3 text-sm text-ink/85">{stat.label}</dt>
                    <dd className="text-[40px] font-medium leading-none tracking-tight lg:text-[44px]">
                      <Counter value={stat.value} />
                    </dd>
                  </Reveal>
                ))}
              </dl>
            )}
          </div>

          <Reveal delay={0.1} className="flex flex-col rounded-[22px] bg-panel p-5">
            {about.showHighlight && (about.highlightValue || about.highlightText) && (
              <div>
                <span className="inline-flex size-12 items-center justify-center rounded-full bg-ink text-panel">
                  <CodeXml className="size-5" strokeWidth={1.75} aria-hidden />
                </span>
                <p className="mt-3 flex items-end gap-4">
                  <span className="text-[40px] font-medium leading-none tracking-tight">
                    <Counter value={about.highlightValue} />
                  </span>
                  <span className="pb-0.5 text-[13px] leading-snug text-ink/85">{about.highlightText}</span>
                </p>
              </div>
            )}
            <div className="group relative mt-5 min-h-[320px] flex-1 overflow-hidden rounded-xl bg-soft">
              {image && (
                <SmartImage
                  src={image.url}
                  alt={image.alt || `${data.settings.developerName} at work`}
                  fill
                  sizes="(min-width: 1024px) 300px, 90vw"
                  className="object-contain object-bottom pt-6 transition-transform duration-[1200ms] ease-premium group-hover:scale-[1.04]"
                />
              )}
            </div>
          </Reveal>

          <div className="flex flex-col">
            {about.showBadge && about.badgeText && (
              <Reveal delay={0.15} className="hidden lg:block">
                <CircularBadge text={about.badgeText} href={about.badgeHref} />
              </Reveal>
            )}
            <Reveal delay={0.2} className="lg:mt-auto">
              {about.journey && (
                <p className="flex gap-3 text-[15px] leading-[1.5] text-ink/80">
                  <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-ink text-panel" aria-hidden>
                    <svg viewBox="0 0 24 24" className="size-3">
                      <path d="M12 0c.9 6.6 5.4 11.1 12 12-6.6.9-11.1 5.4-12 12-.9-6.6-5.4-11.1-12-12C6.600 11.100 11.100 6.600 12 0z" fill="currentColor" />
                    </svg>
                  </span>
                  <span className="whitespace-pre-line">{about.journey}</span>
                </p>
              )}
              {about.features.length > 0 && (
                <ul className="mt-9 space-y-3 border-t border-line pt-9 text-[15px]">
                  {about.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5">
                      <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-ink text-panel" aria-hidden>
                        <Check className="size-2.5" strokeWidth={3.5} />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
              )}
              {about.ctaLabel && (
                <Link href={safeHref(about.ctaHref)} data-cursor className="group mt-8 inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-3 text-[13px] font-semibold text-panel">
                  {about.ctaLabel}
                  <ArrowUpRight className="size-4 transition-transform duration-500 ease-premium group-hover:rotate-45" aria-hidden />
                </Link>
              )}
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
