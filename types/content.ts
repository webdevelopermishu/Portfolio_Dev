export type MediaRef = {
  id: string;
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  mime: string;
  filename?: string;
};

export type HeroContent = {
  headingLine1: string; headingLine2: string; headingSize: "md" | "lg" | "xl"; headingUppercase: boolean;
  titleLine1: string; titleLine2: string; description: string; supporting: string;
  portraitId: string | null; badgeText: string; badgeHref: string; ctaLabel: string; ctaHref: string;
  showStats: boolean; showSkills: boolean; showBadge: boolean; showPortrait: boolean; showTitle: boolean;
  showDescription: boolean; showSupporting: boolean;
};

export type AboutContent = {
  heading: string; biography: string; imageId: string | null; highlightValue: string; highlightText: string;
  journey: string; features: string[]; badgeText: string; badgeHref: string; ctaLabel: string; ctaHref: string;
  showStats: boolean; showHighlight: boolean; showBadge: boolean;
};

export type ProjectsContent = {
  heading: string; limit: number; featuredOnly: boolean; previewLabel: string; viewAllLabel: string;
};

export type ClientsContent = {
  heading: string; description: string; style: "grid" | "marquee"; columns: string; grayscale: boolean;
};

export type TestimonialsContent = { heading: string; autoplay: boolean; showRating: boolean };

export type ContactContent = {
  heading: string; description: string; formHeadingStart: string; formHeadingBold: string; formHeadingEnd: string;
  followLabel: string; ctaText: string; nameLabel: string; emailLabel: string; phoneLabel: string; showPhone: boolean;
  budgetLabel: string; showBudget: boolean; budgetOptions: string[]; typeLabel: string; showProjectType: boolean;
  projectTypes: string[]; detailsLabel: string; successMessage: string;
};

export type SectionContentMap = {
  hero: HeroContent;
  about: AboutContent;
  projects: ProjectsContent;
  clients: ClientsContent;
  testimonials: TestimonialsContent;
  contact: ContactContent;
};
