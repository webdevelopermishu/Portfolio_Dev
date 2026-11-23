import { Hero } from "@/components/public/Hero";
import { About } from "@/components/public/About";
import { SelectedProjects } from "@/components/public/Projects";
import { TrustedBy } from "@/components/public/TrustedBy";
import { Testimonials } from "@/components/public/Testimonials";
import { Contact } from "@/components/public/Contact";
import type { SiteData } from "@/lib/services/content";

/** Renders the home page sections in their configured order, skipping hidden ones. */
export function HomeSections({ data, projectHrefBase }: { data: SiteData; projectHrefBase?: string }) {
  return (
    <>
      {data.orderedSections.map((key) => {
        if (!data.sections[key].visible) return null;
        switch (key) {
          case "hero":
            return <Hero key={key} data={data} />;
          case "about":
            return <About key={key} data={data} />;
          case "projects":
            return <SelectedProjects key={key} data={data} hrefBase={projectHrefBase} />;
          case "clients":
            return <TrustedBy key={key} data={data} />;
          case "testimonials": {
            const cfg = data.sections.testimonials.content;
            return (
              <Testimonials
                key={key}
                heading={cfg.heading}
                autoplay={cfg.autoplay}
                showRating={cfg.showRating}
                items={data.testimonials.map((t) => ({
                  id: t.id, name: t.name, designation: t.designation, company: t.company, text: t.text, rating: t.rating,
                  image: t.companyLogo ?? t.avatar,
                }))}
              />
            );
          }
          case "contact":
            return <Contact key={key} data={data} />;
        }
      })}
    </>
  );
}
