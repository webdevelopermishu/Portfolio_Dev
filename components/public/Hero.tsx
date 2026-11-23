import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SmartImage } from "@/components/shared/SmartImage";
import { CircularBadge } from "@/components/public/CircularBadge";
import { Counter, Magnetic, Parallax, SkillTags } from "@/components/public/motion";
import type { SiteData } from "@/lib/services/content";
import { safeHref } from "@/lib/utils";

const HEADING_SIZES = {
  md: "text-[clamp(2.75rem,6.2vw,5rem)]",
  lg: "text-[clamp(3.1rem,7.4vw,6rem)]",
  xl: "text-[clamp(3.4rem,8.6vw,7.25rem)]",
};

const i = (n: number) => ({ "--i": n }) as React.CSSProperties;

export function Hero({ data }: { data: SiteData }) {
  const hero = data.sections.hero.content;
  const portrait = data.heroPortrait;
  const name = data.settings.developerName;

  return (
    <section id="top" aria-label="Introduction" className="relative px-5 pb-14 pt-8 sm:px-10 lg:px-20 lg:pb-24 lg:pt-[72px]">
      <div className="grid gap-y-10 lg:min-h-[640px] lg:grid-cols-[minmax(0,335fr)_minmax(0,460fr)_minmax(0,290fr)]">
        {/* Left: statistics, skills, badge, name */}
        <div className="relative z-20 flex flex-col">
          {hero.showStats && data.heroStats.length > 0 && (
            <dl className="order-2 mt-8 flex flex-wrap gap-x-10 gap-y-6 lg:order-none lg:mt-0">
              {data.heroStats.map((stat, n) => (
                <div key={stat.id} className="enter flex flex-col-reverse" style={i(1 + n)}>
                  <dt className="mt-3 text-[15px] text-ink/85 lg:text-base">{stat.label}</dt>
                  <dd className="text-[38px] font-medium leading-none tracking-tight lg:text-[42px]">
                    <Counter value={stat.value} />
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {hero.showSkills && data.skills.length > 0 && (
            <div className="order-3 mt-8 lg:order-none lg:mt-12">
              <SkillTags skills={data.skills.map((s) => s.label)} />
            </div>
          )}

          {hero.showBadge && hero.badgeText && (
            <div className="enter order-4 mt-8 hidden lg:order-none lg:mt-7 lg:block" style={i(6)}>
              <CircularBadge text={hero.badgeText} href={hero.badgeHref} />
            </div>
          )}

          <h1
            className={`display order-1 break-words lg:order-none lg:whitespace-nowrap lg:mt-auto lg:pt-10 ${HEADING_SIZES[hero.headingSize] ?? HEADING_SIZES.lg} ${hero.headingUppercase ? "uppercase" : ""}`}
          >
            <span className="line-mask" style={i(0)}>
              <span style={i(0)}>{hero.headingLine1}</span>
            </span>
            <span className="line-mask" style={i(1)}>
              <span style={i(1)}>{hero.headingLine2}</span>
            </span>
          </h1>
        </div>

        {/* Centre: portrait */}
        {hero.showPortrait && (
          <div className="relative z-10 mx-auto h-[420px] w-full max-w-[420px] sm:h-[520px] lg:-mt-10 lg:h-auto lg:max-w-none">
            <Parallax distance={18} className="absolute inset-0 lg:-inset-x-6">
              <div className="enter-portrait portrait-fade relative size-full">
                {portrait ? (
                  <SmartImage
                    src={portrait.url}
                    alt={portrait.alt || `Portrait of ${name}`}
                    fill
                    priority
                    sizes="(min-width: 1024px) 520px, 420px"
                    className="object-contain object-bottom"
                  />
                ) : (
                  <div className="absolute inset-x-8 bottom-0 top-10 rounded-t-full bg-soft" aria-hidden />
                )}
              </div>
            </Parallax>
            {hero.showBadge && hero.badgeText && (
              <div className="absolute bottom-6 left-0 lg:hidden">
                <CircularBadge text={hero.badgeText} href={hero.badgeHref} size={84} />
              </div>
            )}
          </div>
        )}

        {/* Right: title, introduction, supporting statement */}
        <div className="relative z-20 flex flex-col lg:pl-4">
          {hero.showTitle && (hero.titleLine1 || hero.titleLine2) && (
            <p className="enter flex items-start gap-3 lg:mt-5" style={i(2)}>
              <svg viewBox="0 0 32 32" className="mt-2.5 size-7 shrink-0 lg:mt-3 lg:size-8" aria-hidden>
                <path d="M3 4h17l9 9H12z" fill="currentColor" />
                <path d="M3 17h17l9 9H12z" fill="currentColor" />
              </svg>
              <span className="display text-[40px] leading-[1.14] lg:text-[clamp(2rem,3vw,2.6rem)]">
                {hero.titleLine1}
                {hero.titleLine2 && (
                  <>
                    <br />
                    {hero.titleLine2}
                  </>
                )}
              </span>
            </p>
          )}

          {hero.showDescription && hero.description && (
            <div className="enter mt-8 lg:mt-12 lg:text-center" style={i(4)}>
              <svg viewBox="0 0 24 24" className="mb-4 size-6 lg:mx-auto" aria-hidden>
                <path d="M12 0c.9 6.6 5.4 11.1 12 12-6.6.9-11.1 5.4-12 12-.9-6.6-5.4-11.1-12-12C6.600 11.100 11.100 6.600 12 0z" fill="currentColor" />
              </svg>
              <p className="text-[15px] leading-[1.55] text-ink/80 lg:mx-auto lg:max-w-[290px]">{hero.description}</p>
            </div>
          )}

          {hero.ctaLabel && (
            <div className="enter mt-6 lg:text-center" style={i(5)}>
              <Magnetic>
                <Link href={safeHref(hero.ctaHref)} data-cursor className="group inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-3 text-[13px] font-semibold text-panel">
                  {hero.ctaLabel}
                  <ArrowUpRight className="size-4 transition-transform duration-500 ease-premium group-hover:rotate-45" aria-hidden />
                </Link>
              </Magnetic>
            </div>
          )}

          {hero.showSupporting && hero.supporting && (
            <p className="enter mt-10 text-[28px] font-medium leading-[1.17] tracking-tight lg:-ml-4 lg:mt-auto lg:pt-10 lg:text-[clamp(1.6rem,2.45vw,2.15rem)]" style={i(6)}>
              {hero.supporting}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
