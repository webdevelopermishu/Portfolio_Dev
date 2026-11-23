import { SocialIcon } from "@/components/shared/SocialIcon";
import { ContactForm } from "@/components/public/ContactForm";
import { Reveal } from "@/components/public/motion";
import type { SiteData } from "@/lib/services/content";
import { safeHref } from "@/lib/utils";

export function Contact({ data }: { data: SiteData }) {
  const cfg = data.sections.contact.content;
  const { settings, socials } = data;
  const whatsapp = settings.whatsapp.replace(/[^\d]/g, "");
  const pill = "inline-flex max-w-full items-center rounded-full border border-line bg-panel/70 px-4 py-2 text-[13px] text-ink/85 transition-colors hover:border-ink/40 hover:text-ink";

  return (
    <section id="contact" aria-labelledby="contact-heading" className="px-3 sm:px-4">
      <div className="rounded-[28px] bg-soft px-5 py-12 sm:px-10 lg:px-16 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <Reveal className="flex flex-col">
            <h2 id="contact-heading" className="display max-w-[11ch] text-[44px] leading-[1.1] lg:text-[52px]">{cfg.heading}</h2>
            {cfg.description && <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-ink/80">{cfg.description}</p>}
            <ul className="mt-8 flex flex-col items-start gap-2.5">
              {settings.email && (
                <li><a className={pill} href={`mailto:${settings.email}`}><span className="truncate">Mail - {settings.email}</span></a></li>
              )}
              {settings.phone && (
                <li><a className={pill} href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`}>Phone - {settings.phone}</a></li>
              )}
              {whatsapp && (
                <li><a className={pill} href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer">WhatsApp - {settings.whatsapp}</a></li>
              )}
              {settings.location && <li><span className={pill}>Location - {settings.location}</span></li>}
            </ul>
            {socials.length > 0 && (
              <div className="mt-10 lg:mt-auto lg:pt-10">
                <p className="text-xs text-muted">{cfg.followLabel}</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {socials.map((s) => (
                    <li key={s.id}>
                      <a href={safeHref(s.url)} target="_blank" rel="noopener noreferrer me" aria-label={s.label} className="block rounded-full transition-transform duration-300 hover:-translate-y-0.5">
                        <SocialIcon platform={s.platform} className="bg-panel transition-colors hover:bg-ink hover:text-panel" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Reveal>

          <Reveal delay={0.12}>
            <h3 className="text-[26px] font-normal leading-[1.2] tracking-tight text-muted lg:text-[34px]">
              {cfg.formHeadingStart} <strong className="font-semibold text-ink">{cfg.formHeadingBold}</strong> {cfg.formHeadingEnd}
            </h3>
            <ContactForm config={cfg} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
