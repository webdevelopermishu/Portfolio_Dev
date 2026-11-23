/**
 * Declarative field definitions shared by the admin forms (rendering) and the
 * server (Zod validation is generated from the same definitions).
 */
export type FieldType =
  | "text" | "textarea" | "rich" | "number" | "checkbox" | "select" | "image" | "file"
  | "gallery" | "list" | "date" | "datetime" | "color" | "email" | "url" | "password";

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  help?: string;
  placeholder?: string;
  required?: boolean;
  max?: number;
  half?: boolean;
  options?: { value: string; label: string }[];
  group?: string;
};

export type Values = Record<string, unknown>;

const f = (group: string, fields: Omit<Field, "group">[]): Field[] => fields.map((x) => ({ ...x, group }));

// ── Page sections ───────────────────────────────────────────────────────────

export const SECTION_KEYS = ["hero", "about", "projects", "clients", "testimonials", "contact"] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export const SECTION_LABELS: Record<SectionKey, string> = {
  hero: "Hero",
  about: "About",
  projects: "Selected Projects",
  clients: "Trusted By",
  testimonials: "Testimonials",
  contact: "Contact",
};

export const SECTION_FIELDS: Record<SectionKey, Field[]> = {
  hero: [
    ...f("Heading", [
      { name: "headingLine1", label: "Heading — line 1", type: "text", required: true, half: true, max: 40 },
      { name: "headingLine2", label: "Heading — line 2", type: "text", required: true, half: true, max: 40 },
      {
        name: "headingSize", label: "Heading size", type: "select", half: true,
        options: [{ value: "md", label: "Medium" }, { value: "lg", label: "Large" }, { value: "xl", label: "Extra large" }],
      },
      { name: "headingUppercase", label: "Uppercase heading", type: "checkbox", half: true },
    ]),
    ...f("Title & text", [
      { name: "titleLine1", label: "Professional title — line 1", type: "text", half: true, max: 40 },
      { name: "titleLine2", label: "Professional title — line 2", type: "text", half: true, max: 40 },
      { name: "description", label: "Introduction", type: "textarea", max: 400 },
      { name: "supporting", label: "Supporting statement", type: "text", max: 120 },
    ]),
    ...f("Portrait & badge", [
      { name: "portraitId", label: "Portrait image", type: "image", help: "A cut-out PNG/WebP with a transparent background works best. Falls back to the profile photo in Settings." },
      { name: "badgeText", label: "Circular badge text", type: "text", half: true, max: 40 },
      { name: "badgeHref", label: "Badge link", type: "url", half: true },
      { name: "ctaLabel", label: "Hero button label", type: "text", half: true, max: 40, help: "Leave empty to hide the button." },
      { name: "ctaHref", label: "Hero button link", type: "url", half: true },
    ]),
    ...f("Visibility", [
      { name: "showStats", label: "Show statistics", type: "checkbox", half: true },
      { name: "showSkills", label: "Show skill tags", type: "checkbox", half: true },
      { name: "showBadge", label: "Show circular badge", type: "checkbox", half: true },
      { name: "showPortrait", label: "Show portrait", type: "checkbox", half: true },
      { name: "showTitle", label: "Show professional title", type: "checkbox", half: true },
      { name: "showDescription", label: "Show introduction", type: "checkbox", half: true },
      { name: "showSupporting", label: "Show supporting statement", type: "checkbox", half: true },
    ]),
  ],
  about: [
    ...f("Content", [
      { name: "heading", label: "Section heading", type: "text", required: true, max: 60 },
      { name: "biography", label: "Biography", type: "textarea", max: 1200 },
      { name: "imageId", label: "Profile image", type: "image", help: "Falls back to the profile photo in Settings." },
    ]),
    ...f("Achievement card", [
      { name: "highlightValue", label: "Highlight value", type: "text", half: true, max: 12 },
      { name: "highlightText", label: "Highlight description", type: "text", half: true, max: 140 },
    ]),
    ...f("Experience", [
      { name: "journey", label: "Experience description", type: "textarea", max: 600 },
      { name: "features", label: "Highlighted expertise (one per line)", type: "list" },
      { name: "badgeText", label: "Circular badge text", type: "text", half: true, max: 40 },
      { name: "badgeHref", label: "Badge link", type: "url", half: true },
      { name: "ctaLabel", label: "Button label", type: "text", half: true, max: 40, help: "Leave empty to hide the button." },
      { name: "ctaHref", label: "Button link", type: "url", half: true },
    ]),
    ...f("Visibility", [
      { name: "showStats", label: "Show achievement statistics", type: "checkbox", half: true },
      { name: "showHighlight", label: "Show achievement card", type: "checkbox", half: true },
      { name: "showBadge", label: "Show circular badge", type: "checkbox", half: true },
    ]),
  ],
  projects: f("Content", [
    { name: "heading", label: "Section heading", type: "text", required: true, max: 60 },
    { name: "limit", label: "Projects shown on the home page", type: "number", half: true },
    { name: "featuredOnly", label: "Only show featured projects", type: "checkbox", half: true },
    { name: "previewLabel", label: "Card button label", type: "text", half: true, max: 30 },
    { name: "viewAllLabel", label: "“View all” label", type: "text", half: true, max: 20, help: "Leave empty to hide." },
  ]),
  clients: f("Content", [
    { name: "heading", label: "Section heading", type: "text", required: true, max: 60 },
    { name: "description", label: "Supporting text", type: "text", max: 160 },
    {
      name: "style", label: "Logo display style", type: "select", half: true,
      options: [{ value: "grid", label: "Bordered grid" }, { value: "marquee", label: "Scrolling row" }],
    },
    {
      name: "columns", label: "Grid columns (desktop)", type: "select", half: true,
      options: ["3", "4", "5"].map((v) => ({ value: v, label: v })),
    },
    { name: "grayscale", label: "Show logos in grayscale", type: "checkbox" },
  ]),
  testimonials: f("Content", [
    { name: "heading", label: "Section heading", type: "text", required: true, max: 60 },
    { name: "autoplay", label: "Auto-advance the carousel", type: "checkbox", half: true },
    { name: "showRating", label: "Show star ratings", type: "checkbox", half: true },
  ]),
  contact: [
    ...f("Headings", [
      { name: "heading", label: "Section heading", type: "text", required: true, max: 80 },
      { name: "description", label: "Description", type: "textarea", max: 300 },
      { name: "formHeadingStart", label: "Form heading — start", type: "text", max: 80 },
      { name: "formHeadingBold", label: "Form heading — emphasised", type: "text", half: true, max: 80 },
      { name: "formHeadingEnd", label: "Form heading — end", type: "text", half: true, max: 80 },
      { name: "followLabel", label: "Social links label", type: "text", half: true, max: 30 },
      { name: "ctaText", label: "Submit button text", type: "text", half: true, required: true, max: 40 },
    ]),
    ...f("Form fields", [
      { name: "nameLabel", label: "Name field label", type: "text", half: true, max: 40 },
      { name: "emailLabel", label: "Email field label", type: "text", half: true, max: 40 },
      { name: "phoneLabel", label: "Phone field label", type: "text", half: true, max: 40 },
      { name: "showPhone", label: "Show phone field", type: "checkbox", half: true },
      { name: "budgetLabel", label: "Budget field label", type: "text", half: true, max: 40 },
      { name: "showBudget", label: "Show budget field", type: "checkbox", half: true },
      { name: "budgetOptions", label: "Budget options (one per line)", type: "list" },
      { name: "typeLabel", label: "Project type field label", type: "text", half: true, max: 40 },
      { name: "showProjectType", label: "Show project type field", type: "checkbox", half: true },
      { name: "projectTypes", label: "Project types (one per line)", type: "list" },
      { name: "detailsLabel", label: "Details field label", type: "text", half: true, max: 40 },
      { name: "successMessage", label: "Success message", type: "text", max: 200 },
    ]),
  ],
};

export const SECTION_DEFAULTS: Record<SectionKey, Values> = {
  hero: {
    headingLine1: "I AM", headingLine2: "YOUR NAME", headingSize: "lg", headingUppercase: true,
    titleLine1: "Application", titleLine2: "Developer", description: "", supporting: "",
    portraitId: null, badgeText: "View Portfolio", badgeHref: "#projects", ctaLabel: "", ctaHref: "#contact",
    showStats: true, showSkills: true, showBadge: true, showPortrait: true, showTitle: true,
    showDescription: true, showSupporting: true,
  },
  about: {
    heading: "About Me", biography: "", imageId: null, highlightValue: "", highlightText: "", journey: "",
    features: [], badgeText: "View Portfolio", badgeHref: "#projects", ctaLabel: "", ctaHref: "#contact",
    showStats: true, showHighlight: true, showBadge: true,
  },
  projects: { heading: "Selected Projects", limit: 4, featuredOnly: false, previewLabel: "Preview Project", viewAllLabel: "View All" },
  clients: { heading: "Trusted By", description: "", style: "grid", columns: "4", grayscale: true },
  testimonials: { heading: "My Clients Feedback", autoplay: true, showRating: false },
  contact: {
    heading: "Want To Discuss With Me?", description: "", formHeadingStart: "Let's Talk! Don't hesitate to",
    formHeadingBold: "reach out and share", formHeadingEnd: "details about your project.", followLabel: "Follow Me",
    ctaText: "Schedule a Meeting", nameLabel: "Your Name", emailLabel: "Email", phoneLabel: "Phone (optional)",
    showPhone: true, budgetLabel: "Project Budget", showBudget: true, budgetOptions: [], typeLabel: "Project Type",
    showProjectType: true, projectTypes: [], detailsLabel: "Project Details",
    successMessage: "Thank you — your message has been sent. I'll get back to you shortly.",
  },
};

// ── Entities ────────────────────────────────────────────────────────────────

const PUBLISH_OPTIONS = [{ value: "DRAFT", label: "Draft" }, { value: "PUBLISHED", label: "Published" }];

export const PROJECT_FIELDS: Field[] = [
  ...f("Basics", [
    { name: "title", label: "Project title", type: "text", required: true, max: 120 },
    { name: "slug", label: "Slug", type: "text", max: 80, help: "Used in the URL: /projects/your-slug. Leave empty to generate from the title." },
    { name: "shortDescription", label: "Short description", type: "textarea", max: 300 },
    { name: "description", label: "Detailed description", type: "rich" },
    { name: "category", label: "Category", type: "text", half: true, max: 60 },
    { name: "clientName", label: "Client name", type: "text", half: true, max: 80 },
    { name: "technologies", label: "Technology stack (one per line)", type: "list" },
    { name: "projectUrl", label: "Project URL", type: "url", half: true },
    { name: "githubUrl", label: "GitHub URL", type: "url", half: true },
    { name: "completedAt", label: "Completion date", type: "date", half: true },
    {
      name: "projectStatus", label: "Project status", type: "select", half: true,
      options: ["Completed", "In progress", "Maintained", "Concept"].map((v) => ({ value: v, label: v })),
    },
  ]),
  ...f("Images", [
    { name: "featuredImageId", label: "Featured image", type: "image" },
    { name: "gallery", label: "Gallery images", type: "gallery" },
  ]),
  ...f("Publishing", [
    { name: "status", label: "Visibility", type: "select", half: true, options: PUBLISH_OPTIONS },
    { name: "publishAt", label: "Schedule publish time", type: "datetime", half: true, help: "Optional. A published project stays hidden until this time." },
    { name: "featured", label: "Featured project", type: "checkbox", half: true },
    { name: "order", label: "Display order", type: "number", half: true },
  ]),
  ...f("SEO", [
    { name: "seoTitle", label: "SEO title", type: "text", max: 70, help: "Defaults to the project title." },
    { name: "seoDescription", label: "SEO description", type: "textarea", max: 170, help: "Defaults to the short description." },
    { name: "ogImageId", label: "Social sharing (OG) image", type: "image", help: "Defaults to the featured image." },
    { name: "robotsIndex", label: "Allow search engines to index", type: "checkbox", half: true },
    { name: "includeInSitemap", label: "Include in sitemap", type: "checkbox", half: true },
  ]),
];

export const TESTIMONIAL_FIELDS: Field[] = f("Testimonial", [
  { name: "name", label: "Client name", type: "text", required: true, half: true, max: 80 },
  { name: "designation", label: "Designation", type: "text", half: true, max: 80 },
  { name: "company", label: "Company", type: "text", half: true, max: 80 },
  { name: "rating", label: "Rating (1–5)", type: "select", half: true, options: ["5", "4", "3", "2", "1"].map((v) => ({ value: v, label: `${v} stars` })) },
  { name: "text", label: "Review text", type: "textarea", required: true, max: 800 },
  { name: "avatarId", label: "Client profile image", type: "image", half: true },
  { name: "companyLogoId", label: "Company logo", type: "image", half: true },
  { name: "status", label: "Visibility", type: "select", half: true, options: PUBLISH_OPTIONS },
  { name: "order", label: "Display order", type: "number", half: true },
  { name: "featured", label: "Featured", type: "checkbox" },
]);

export const CLIENT_FIELDS: Field[] = f("Client", [
  { name: "name", label: "Client name", type: "text", required: true, half: true, max: 80 },
  { name: "url", label: "Website URL", type: "url", half: true },
  { name: "logoId", label: "Logo", type: "image", help: "Without a logo, the client name is shown as a wordmark." },
  { name: "order", label: "Display order", type: "number", half: true },
  { name: "visible", label: "Visible on the site", type: "checkbox", half: true },
]);

export const HEADING_FONTS = [
  { value: "bodoni", label: "Bodoni Moda", stack: "'Bodoni Moda Variable', 'Bodoni MT', Didot, Georgia, serif" },
  { value: "playfair", label: "Playfair Display", stack: "'Playfair Display Variable', Georgia, serif" },
  { value: "cormorant", label: "Cormorant Garamond", stack: "'Cormorant Garamond Variable', Garamond, Georgia, serif" },
];
export const BODY_FONTS = [
  { value: "inter", label: "Inter", stack: "'Inter Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif" },
  { value: "system", label: "System UI", stack: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
];

export const SETTINGS_FIELDS: Field[] = [
  ...f("Identity", [
    { name: "siteName", label: "Website name", type: "text", required: true, half: true, max: 80 },
    { name: "logoText", label: "Logo text", type: "text", required: true, half: true, max: 40 },
    { name: "developerName", label: "Developer name", type: "text", required: true, half: true, max: 80 },
    { name: "professionalTitle", label: "Professional title", type: "text", required: true, half: true, max: 80 },
    { name: "logoId", label: "Logo image (optional, replaces logo text)", type: "image", half: true },
    { name: "faviconId", label: "Favicon", type: "image", half: true, help: "PNG or ICO, square, at least 64×64." },
    { name: "profileImageId", label: "Profile photo", type: "image", half: true },
    { name: "cvId", label: "CV / résumé file (PDF)", type: "file", half: true },
  ]),
  ...f("Contact information", [
    { name: "email", label: "Email address", type: "email", half: true },
    { name: "phone", label: "Phone number", type: "text", half: true, max: 40 },
    { name: "whatsapp", label: "WhatsApp number", type: "text", half: true, max: 40, help: "International format, e.g. +8801XXXXXXXXX." },
    { name: "location", label: "Location", type: "text", half: true, max: 80 },
  ]),
  ...f("Header & footer", [
    { name: "navCtaLabel", label: "Header button label", type: "text", half: true, max: 30, help: "Leave empty to hide." },
    { name: "navCtaHref", label: "Header button link", type: "url", half: true },
    { name: "cvLabel", label: "CV download label", type: "text", half: true, max: 30 },
    { name: "footerText", label: "Copyright text", type: "text", half: true, max: 160, help: "Use {year} for the current year." },
    { name: "footerCredit", label: "Footer credit (optional)", type: "text", max: 120 },
  ]),
  ...f("Colours", [
    { name: "colorBackground", label: "Page background", type: "color", half: true },
    { name: "colorPanel", label: "Content panel", type: "color", half: true },
    { name: "colorSoft", label: "Soft section background", type: "color", half: true },
    { name: "colorInk", label: "Text & buttons", type: "color", half: true },
    { name: "colorMuted", label: "Secondary text", type: "color", half: true },
  ]),
  ...f("Typography & motion", [
    { name: "headingFont", label: "Heading typeface", type: "select", half: true, options: HEADING_FONTS.map(({ value, label }) => ({ value, label })) },
    { name: "bodyFont", label: "Body typeface", type: "select", half: true, options: BODY_FONTS.map(({ value, label }) => ({ value, label })) },
    { name: "smoothScroll", label: "Smooth scrolling", type: "checkbox", half: true },
    { name: "customCursor", label: "Custom cursor on desktop", type: "checkbox", half: true },
    { name: "analyticsEnabled", label: "Record anonymous page views", type: "checkbox", half: true },
  ]),
  ...f("Email", [
    { name: "notifyEmail", label: "Send new-lead notifications to", type: "email", half: true, help: "Defaults to the contact email address." },
    { name: "emailFromName", label: "Sender name", type: "text", half: true, max: 60 },
    { name: "autoReplyEnabled", label: "Send a confirmation email to the sender", type: "checkbox" },
    { name: "autoReplySubject", label: "Confirmation subject", type: "text", max: 120 },
    { name: "autoReplyBody", label: "Confirmation message", type: "textarea", max: 1500, help: "Use {name} for the sender's name." },
  ]),
];

export const SEO_FIELDS: Field[] = [
  ...f("Search", [
    { name: "title", label: "SEO title", type: "text", required: true, max: 70 },
    { name: "titleTemplate", label: "Title template for inner pages", type: "text", max: 80, help: "%s is replaced by the page title, e.g. “%s — Your Name”." },
    { name: "description", label: "Meta description", type: "textarea", max: 170 },
    { name: "keywords", label: "Focus keywords", type: "text", max: 300, help: "Editorial reference only — search engines ignore the keywords tag, so it is not output." },
    { name: "canonicalUrl", label: "Canonical URL", type: "url", help: "Leave empty to use the site URL." },
  ]),
  ...f("Social sharing", [
    { name: "ogTitle", label: "OG title", type: "text", max: 90 },
    { name: "ogDescription", label: "OG description", type: "textarea", max: 200 },
    { name: "ogImageId", label: "OG image (1200×630)", type: "image" },
    {
      name: "twitterCard", label: "Twitter / X card", type: "select", half: true,
      options: [{ value: "summary_large_image", label: "Large image" }, { value: "summary", label: "Summary" }],
    },
    { name: "twitterHandle", label: "Twitter / X handle", type: "text", half: true, max: 30, placeholder: "@handle" },
  ]),
  ...f("Indexing & schema", [
    { name: "robotsIndex", label: "Allow indexing", type: "checkbox", half: true },
    { name: "robotsFollow", label: "Allow following links", type: "checkbox", half: true },
    { name: "includeInSitemap", label: "Include home page in sitemap", type: "checkbox", half: true },
    {
      name: "schemaType", label: "Structured data type", type: "select", half: true,
      options: [{ value: "Person", label: "Person" }, { value: "ProfessionalService", label: "Person + ProfessionalService" }],
    },
  ]),
];

// ── Simple ordered lists (edited inline) ────────────────────────────────────

export type ListKind = "skill" | "heroStat" | "aboutStat" | "nav" | "social" | "redirect";

export const LIST_FIELDS: Record<ListKind, Field[]> = {
  skill: [{ name: "label", label: "Skill", type: "text", required: true, max: 40 }],
  heroStat: [
    { name: "value", label: "Value", type: "text", required: true, max: 12 },
    { name: "label", label: "Label", type: "text", required: true, max: 40 },
  ],
  aboutStat: [
    { name: "value", label: "Value", type: "text", required: true, max: 12 },
    { name: "label", label: "Label", type: "text", required: true, max: 40 },
  ],
  nav: [
    { name: "label", label: "Label", type: "text", required: true, max: 30 },
    { name: "href", label: "Link", type: "url", required: true, placeholder: "#about or /projects" },
  ],
  social: [
    { name: "label", label: "Label", type: "text", required: true, max: 30 },
    {
      name: "platform", label: "Icon", type: "select",
      options: ["github", "linkedin", "x", "dribbble", "behance", "instagram", "facebook", "youtube", "whatsapp", "website"].map((v) => ({ value: v, label: v })),
    },
    { name: "url", label: "URL", type: "url", required: true },
    { name: "showInFooter", label: "Footer", type: "checkbox" },
  ],
  redirect: [
    { name: "source", label: "From path", type: "text", required: true, max: 200, placeholder: "/old-path" },
    { name: "destination", label: "To", type: "url", required: true, placeholder: "/new-path" },
    { name: "permanent", label: "301", type: "checkbox" },
  ],
};
