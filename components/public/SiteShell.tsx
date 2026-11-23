import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { CustomCursor, PageView, SmoothScroll } from "@/components/public/Effects";
import { ScrollProgress } from "@/components/public/motion";
import type { SiteData } from "@/lib/services/content";

/** Page chrome shared by the public site and the admin preview: ambient background, white panel, header and footer. */
export function SiteShell({ data, children, track = true }: { data: SiteData; children: React.ReactNode; track?: boolean }) {
  const { settings } = data;
  return (
    <>
      <a href="#main" className="sr-only z-[80] rounded-full bg-ink px-4 py-2 text-sm text-panel focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to content
      </a>
      <div className="ambient" aria-hidden />
      {settings.smoothScroll && <SmoothScroll />}
      {settings.customCursor && <CustomCursor />}
      {track && settings.analyticsEnabled && <PageView />}
      <ScrollProgress />
      <div className="mx-auto max-w-[1288px] px-2 py-2 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
        <div className="overflow-hidden rounded-[22px] bg-panel shadow-[0_30px_80px_-40px_rgb(15_21_36/0.25)] sm:rounded-[28px]">
          <Header
            logoText={settings.logoText}
            logo={settings.logo}
            nav={data.nav.map(({ id, label, href }) => ({ id, label, href }))}
            cta={{ label: settings.navCtaLabel, href: settings.navCtaHref }}
          />
          <main id="main">{children}</main>
          <Footer data={data} />
        </div>
      </div>
    </>
  );
}
